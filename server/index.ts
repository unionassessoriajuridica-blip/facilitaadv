import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import crypto from 'crypto';

// --- NOVOS IMPORTS DO SISTEMA DE WHATSAPP ---
import roboRoutes from "./routes/robo";
import webhookRoutes from "./routes/webhook";
import zapsignRoutes from "./routes/zapsign";
import googleRoutes from "./routes/google";
import alertsRoutes from "./routes/alerts";
// Certifique-se de importar o cron de cobrança
import { startCobrancaCron } from "./cron/cobrancaCron";
// --------------------------------------------

// Routes will be lazy-loaded to speed up startup
console.time("Total Startup");
console.time("Imports");

// === LOG DEBUG (REMOVER DEPOIS) ===
console.log('[DEBUG] Teste .env:', {
  SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
  ZAPSIGN: !!process.env.ZAPSIGN_API_TOKEN
});
// ==================================

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Request Logger Settings
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      const hasAuth = !!req.headers.authorization;
      logLine += ` | Auth: ${hasAuth} | Content-Type: ${req.headers['content-type']}`;

      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 150) {
        logLine = logLine.slice(0, 149) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// ⚡ CRITICAL ROUTES - Pre-loaded for instant availability

// REGISTER ROUTES
// Colocamos o Webhook no topo para garantir prioridade de resposta à Meta
app.use("/api/webhook", webhookRoutes); 
app.use("/api/robo", roboRoutes);
app.use("/api/zapsign", zapsignRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/alerts", alertsRoutes);

// ⏳ NON-CRITICAL ROUTES - Lazy-loaded to keep startup fast
app.use("/api/email", (req, res, next) => {
  import("./routes/email").then(m => m.default(req, res, next)).catch(next);
});
app.use("/api/tasks", (req, res, next) => {
  import("./routes/tasks").then(m => m.default(req, res, next)).catch(next);
});

// Dashboard stats routes - using SERVICE_ROLE_KEY to bypass RLS
app.get("/api/stats/processos", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/processos?status=eq.ATIVO&select=id`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const data = await response.json();
    res.json({ count: Array.isArray(data) ? data.length : 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/stats/clientes", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clientes?select=id`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const data = await response.json();
    res.json({ count: Array.isArray(data) ? data.length : 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/stats/audiencias", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const hoje = new Date().toISOString().split("T")[0];
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/processos?prazo=eq.${hoje}&select=id`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const data = await response.json();
    res.json({ count: Array.isArray(data) ? data.length : 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/processos/:id/financeiro", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const { id } = req.params;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const processoRes = await fetch(`${SUPABASE_URL}/rest/v1/processos?id=eq.${id}&select=*,clientes(nome)`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const processos = await processoRes.json();
    const processo = processos[0];
    if (!processo) return res.status(404).json({ error: "Processo not found" });
    const clienteNome = processo.clientes?.nome || "";
    const response = await fetch(`${SUPABASE_URL}/rest/v1/financeiro?cliente_nome=eq.${encodeURIComponent(clienteNome)}&order=created_at.asc&select=*`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const data = await response.json();
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/processos/:id/observacoes", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const { id } = req.params;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/observacoes_processo?processo_id=eq.${id}&select=*`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const data = await response.json();
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/processos/:id/documentos", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const { id } = req.params;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const fetchUrl = `${SUPABASE_URL}/rest/v1/processo_documentos_drive?processo_id=eq.${id}&select=*`;
    const response = await fetch(fetchUrl, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const data = await response.json();
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/processos/:id/responsavel", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const { id } = req.params;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/responsavel_financeiro?processo_id=eq.${id}&select=*`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const data = await response.json();
    res.json(data[0] || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/processos/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const { id } = req.params;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/processos?id=eq.${id}&select=*,clientes(*)`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const processos = await response.json();
    res.json(processos[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/processos", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const { search, limit = '20' } = req.query;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let url = `${SUPABASE_URL}/rest/v1/processos`;
    if (search && typeof search === 'string' && search.length >= 3) {
      url += `?select=id,numero_processo&numero_processo=ilike.*${encodeURIComponent(search)}*&order=numero_processo.asc&limit=${limit}`;
    } else {
      url += `?status=eq.ATIVO&select=*,clientes(nome)&order=created_at.desc`;
    }
    const response = await fetch(url, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const processos = await response.json();
    res.json(processos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/clientes", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const { search, limit = '20' } = req.query;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let url = `${SUPABASE_URL}/rest/v1/clientes?select=id,nome,cpf_cnpj&order=nome.asc&limit=${limit}`;
    if (search && typeof search === 'string' && search.length >= 2) {
      url += `&nome=ilike.*${encodeURIComponent(search)}*`;
    }
    const response = await fetch(url, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const clientes = await response.json();
    res.json(clientes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/clientes/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const { id } = req.params;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${id}&select=*`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    const data = await response.json();
    res.json(data[0] || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/datajud", (req, res, next) => {
  import("./routes/datajud").then(m => m.default(req, res, next)).catch(next);
});

app.post("/api/datajud", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/datajud-lookup`;
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/notifications", (req, res, next) => {
  import("./routes/notifications").then(m => m.default(req, res, next)).catch(next);
});

const jobStatus = new Map<string, any>();

app.post("/api/datajud/check-prazos", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Não autorizado' });
    const jobId = crypto.randomUUID();
    jobStatus.set(jobId, { status: 'running', progress: 0, startedAt: new Date().toISOString() });
    res.json({ success: true, jobId, message: 'Verificação iniciada' });

    const runDatajudBatchCron = (global as any).__runDatajudBatchCron;
    if (!runDatajudBatchCron) return;

    runDatajudBatchCron().then((result: any) => {
      jobStatus.set(jobId, {
        status: 'completed',
        progress: 100,
        result,
        completedAt: new Date().toISOString()
      });
      setTimeout(() => jobStatus.delete(jobId), 300000);
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/datajud/check-prazos/:jobId", (req, res) => {
  const status = jobStatus.get(req.params.jobId);
  if (!status) return res.status(404).json({ error: 'Job não encontrado' });
  res.json(status);
});

app.use("/api", (req, res, next) => {
  import("./routes/proxy").then(m => m.default(req, res, next)).catch(next);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/api")) {
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({ error: err.message || "Internal Server Error" });
  }
  next(err);
});

(async () => {
  const server = createServer({ maxHeaderSize: 32768 }, app);
  if (app.get("env") === "development") {
    console.timeEnd("Imports");
    console.time("Setup Vite");
    await setupVite(app, server);
    console.timeEnd("Setup Vite");
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
    Promise.all([
      import("./cron/datajud").then(module => {
        module.startDatajudCron();
        (global as any).__runDatajudBatchCron = module.runDatajudBatchCron;
        log("✅ DataJud cron ready");
      }),
      import("./cron/notificacoes-prazos").then(module => {
        module.startPrazosEmailNotifications();
        log("✅ Email cron ready");
      })
      ,
      // ADICIONA AQUI: Cron de cobrança
      import("./cron/cobrancaCron").then(module => {
        module.startCobrancaCron(); // Inicia o agendador
        log("✅ Cobrança cron ready");
      })
    ]);
  });
})();