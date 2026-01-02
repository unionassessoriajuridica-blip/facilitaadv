import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
// import "dotenv/config";
// ⚡ Cron imports moved to lazy loading (see server.listen callback)
// import { startDatajudCron, runDatajudBatchCron } from "./cron/datajud";
// import { startPrazosEmailNotifications } from "./cron/notificacoes-prazos";
import crypto from 'crypto';

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
      // Log headers for debugging Authorization
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
import zapsignRoutes from "./routes/zapsign";
import googleRoutes from "./routes/google";
import alertsRoutes from "./routes/alerts";

// Register critical routes (pre-loaded)
app.use("/api/zapsign", zapsignRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/alerts", alertsRoutes);


// ADICIONE ESTAS DUAS LINHAS:
import roboRoutes from "./routes/robo";
app.use("/api/robo", roboRoutes);

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

// Rotas específicas de sub-recursos devem vir ANTES da rota genérica :id
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

    if (!processo) {
      return res.status(404).json({ error: "Processo not found" });
    }

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

    console.log(`[API] Buscando documentos para processo: ${id}`);
    const fetchUrl = `${SUPABASE_URL}/rest/v1/processo_documentos_drive?processo_id=eq.${id}&select=*`;

    // Sistema GLOBAL: Usar SERVICE_KEY para bypass RLS
    const requestHeaders: HeadersInit = {
      "apikey": SUPABASE_SERVICE_KEY || "",
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` // Global access
    };

    const response = await fetch(fetchUrl, {
      headers: requestHeaders
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Erro ao buscar documentos: ${response.status}`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log(`[API] Documentos encontrados: ${Array.isArray(data) ? data.length : 0}`);
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

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).send(error);
    }

    const processos = await response.json();
    if (!processos || processos.length === 0) {
      return res.status(404).json({ error: "Processo não encontrado" });
    }

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
      // Busca por número de processo
      url += `?select=id,numero_processo&numero_processo=ilike.*${encodeURIComponent(search)}*&order=numero_processo.asc&limit=${limit}`;
    } else {
      // Lista todos os processos ativos (compatibilidade)
      url += `?status=eq.ATIVO&select=*,clientes(nome)&order=created_at.desc`;
    }

    const response = await fetch(url, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).send(error);
    }

    const processos = await response.json();
    res.json(processos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clientes - Buscar clientes com filtro de busca (ignora RLS)
app.get("/api/clientes", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

    const { search, limit = '20' } = req.query;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let url = `${SUPABASE_URL}/rest/v1/clientes?select=id,nome,cpf_cnpj&order=nome.asc&limit=${limit}`;

    // Adiciona filtro de busca se fornecido
    if (search && typeof search === 'string' && search.length >= 2) {
      url += `&nome=ilike.*${encodeURIComponent(search)}*`;
    }

    const response = await fetch(url, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).send(error);
    }

    const clientes = await response.json();
    res.json(clientes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clientes/:id - Buscar cliente individual
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

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).send(error);
    }

    const data = await response.json();
    res.json(data[0] || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Removidas duplicatas de rotas específicas que foram movidas para cima

// Nova rota DataJud (substitui Edge Function)
app.use("/api/datajud", (req, res, next) => {
  import("./routes/datajud").then(m => m.default(req, res, next)).catch(next);
});

// POST /api/datajud - Proxy para Edge Function datajud-lookup (evitar CORS)
app.post("/api/datajud", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/datajud-lookup`;

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/notifications", (req, res, next) => {
  import("./routes/notifications").then(m => m.default(req, res, next)).catch(next);
});

// ==============================================
// Background Job Endpoints for DataJud
// ==============================================

// Armazenar status de jobs em memória (em produção, usar Redis)
const jobStatus = new Map<string, any>();

// Endpoint para iniciar verificação manual de prazos (background)
app.post("/api/datajud/check-prazos", async (req, res) => {
  console.log('[API] POST /api/datajud/check-prazos chamado');
  try {
    // Verificar autenticação
    const token = req.headers.authorization?.split(' ')[1];
    console.log('[API] Token presente:', !!token);
    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Criar job ID único
    const jobId = crypto.randomUUID();
    jobStatus.set(jobId, {
      status: 'running',
      progress: 0,
      startedAt: new Date().toISOString()
    });

    // Responder imediatamente (não esperar execução)
    console.log('[API] Retornando jobId:', jobId);
    res.json({
      success: true,
      jobId,
      message: 'Verificação iniciada em background'
    });

    // Executar cron em background (sem await)
    // Use lazy-loaded reference from global scope
    const runDatajudBatchCron = (global as any).__runDatajudBatchCron;

    if (!runDatajudBatchCron) {
      return res.status(503).json({
        error: 'DataJud cron ainda não foi inicializado. Aguarde alguns segundos e tente novamente.'
      });
    }

    runDatajudBatchCron().then((result: any) => {
      if (!result) {
        throw new Error('Execução do cron não retornou resultado');
      }

      jobStatus.set(jobId, {
        status: 'completed',
        progress: 100,
        result: {
          prazosCreated: result.prazosCreated,
          processesUpdated: result.processesUpdated,
          duration: result.duration
        },
        completedAt: new Date().toISOString()
      });

      // Limpar job após 5 minutos
      setTimeout(() => {
        jobStatus.delete(jobId);
      }, 5 * 60 * 1000);

    }).catch((error: any) => {
      jobStatus.set(jobId, {
        status: 'error',
        error: error.message,
        failedAt: new Date().toISOString()
      });
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para verificar status do job (polling)
app.get("/api/datajud/check-prazos/:jobId", (req, res) => {
  const { jobId } = req.params;
  const status = jobStatus.get(jobId);

  if (!status) {
    return res.status(404).json({ error: 'Job não encontrado' });
  }

  res.json(status);
});

app.use("/api", (req, res, next) => {
  import("./routes/proxy").then(m => m.default(req, res, next)).catch(next);
});

// Global Error Handler - Ensure we always return JSON for /api routes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  if (req.path.startsWith("/api")) {
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({
      error: err.message || "Internal Server Error",
      code: err.code,
      details: err.details
    });
  }

  next(err);
});

(async () => {
  // Explicitly set maxHeaderSize to 32KB to avoid Error 431
  const server = createServer({ maxHeaderSize: 32768 }, app);

  // Hot Reload (Dev) or Static (Prod)
  if (app.get("env") === "development") {
    console.timeEnd("Imports");
    console.time("Setup Vite");
    await setupVite(app, server);
    console.timeEnd("Setup Vite");
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  console.time("Server Listen");
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.timeEnd("Server Listen");
    console.timeEnd("Total Startup");
    log(`serving on port ${port}`);

    // ⚡ Lazy load cron jobs asynchronously (não bloqueia startup)
    log("Initializing cron jobs in background...");

    Promise.all([
      import("./cron/datajud").then(module => {
        module.startDatajudCron();
        log("✅ DataJud cron job scheduled");
        // Export runDatajudBatchCron for API endpoint usage
        return { runDatajudBatchCron: module.runDatajudBatchCron };
      }).catch(err => {
        console.error("❌ Failed to load DataJud cron:", err);
        return null;
      }),

      import("./cron/notificacoes-prazos").then(module => {
        module.startPrazosEmailNotifications();
        log("✅ Email notifications cron job scheduled");
        return true;
      }).catch(err => {
        console.error("❌ Failed to load Email notifications cron:", err);
        return null;
      })
    ]).then((results) => {
      const [datajudModule] = results;
      if (datajudModule && datajudModule.runDatajudBatchCron) {
        // Store reference for API endpoint (line 471)
        (global as any).__runDatajudBatchCron = datajudModule.runDatajudBatchCron;
      }
      log("🎉 All cron jobs initialized successfully");
    }).catch(err => {
      console.error("❌ Critical error initializing cron jobs:", err);
    });
  });
})();
