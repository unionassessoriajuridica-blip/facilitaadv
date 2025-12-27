import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import "dotenv/config";
import { startDatajudCron, runDatajudBatchCron } from "./cron/datajud";
import { startPrazosEmailNotifications } from "./cron/notificacoes-prazos";
import crypto from 'crypto';

// Routes will be lazy-loaded to speed up startup

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

// API Routes (Lazy-loaded)
app.use("/api/zapsign", (req, res, next) => {
  import("./routes/zapsign").then(m => m.default(req, res, next)).catch(next);
});
app.use("/api/google", (req, res, next) => {
  import("./routes/google").then(m => m.default(req, res, next)).catch(next);
});
app.use("/api/email", (req, res, next) => {
  import("./routes/email").then(m => m.default(req, res, next)).catch(next);
});
app.use("/api/alerts", (req, res, next) => {
  import("./routes/alerts").then(m => m.default(req, res, next)).catch(next);
});

// Inline tasks route - fetches ALL tasks without user filter
app.get("/api/tasks", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

    const { process_id, status } = req.query;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let queryParams = ["select=*", "order=due_date.asc"];
    if (process_id) queryParams.push(`process_id=eq.${process_id}`);
    if (status) queryParams.push(`status=eq.${status}`);

    const tasksResponse = await fetch(`${SUPABASE_URL}/rest/v1/tasks?${queryParams.join("&")}`, {
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
      },
    });

    if (!tasksResponse.ok) {
      const error = await tasksResponse.text();
      log(`[Tasks API] Supabase error ${tasksResponse.status}: ${error}`);
      return res.status(tasksResponse.status).send(error);
    }

    const tasks = await tasksResponse.json();
    res.json(tasks);
  } catch (error: any) {
    log(`[Tasks API] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
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

// IMPORTANT: Route with :id parameter must come BEFORE generic route
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

// GET /api/processos/:id/financeiro - Buscar dados financeiros do processo
app.get("/api/processos/:id/financeiro", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

    const { id } = req.params;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Primeiro buscar o processo para pegar o cliente_nome
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

    // Buscar financeiro por cliente_nome
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

// GET /api/processos/:id/observacoes - Buscar observações do processo
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

// GET /api/processos/:id/documentos - Buscar documentos do processo
app.get("/api/processos/:id/documentos", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

    const { id } = req.params;
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await fetch(`${SUPABASE_URL}/rest/v1/documentos_processo?processo_id=eq.${id}&select=*`, {
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

// GET /api/processos/:id/responsavel - Buscar responsável financeiro do processo
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

(async () => {
  // Explicitly set maxHeaderSize to 32KB to avoid Error 431
  const server = createServer({ maxHeaderSize: 32768 }, app);

  // Hot Reload (Dev) or Static (Prod)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);

    // Iniciar cron job do DataJud (atualiza processos a cada 2 horas)
    startDatajudCron();

    // Iniciar cron job de notificações de prazos (diário às 09:00)
    startPrazosEmailNotifications();
  });
})();
