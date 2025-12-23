import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import * as zapsignService from "./services/zapsignService";
import * as googleDriveService from "./services/googleDriveService";
import * as resendService from "./services/resendService";
import type { ZapsignCreateDocRequest } from "@shared/schema";
import multer from "multer";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Proxy para Edge Functions do Supabase (evita problemas de CORS)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// ZapSign API Routes (server-side to protect API token)
app.post("/api/zapsign/documents", async (req: Request, res: Response) => {
  try {
    const docRequest: ZapsignCreateDocRequest = req.body;
    const { clientName, notifyEmail } = req.body;
    
    if (!docRequest.name || !docRequest.signers || docRequest.signers.length === 0) {
      return res.status(400).json({ error: "Name and at least one signer are required" });
    }
    
    if (!docRequest.url_pdf && !docRequest.base64_pdf) {
      return res.status(400).json({ error: "Either url_pdf or base64_pdf is required" });
    }
    
    const result = await zapsignService.createDocument(docRequest);
    
    // Send email notification to signers (if enabled and email available)
    if (notifyEmail !== false && result.signers && result.signers.length > 0) {
      for (const signer of result.signers) {
        if (signer.email && signer.sign_url) {
          try {
            await resendService.sendDocumentSignatureRequest({
              to: signer.email,
              clientName: clientName || docRequest.name,
              documentName: docRequest.name,
              signerName: signer.name,
              signatureUrl: signer.sign_url,
            });
            console.log(`[ZapSign] Email notification sent to ${signer.email}`);
          } catch (emailError) {
            console.error(`[ZapSign] Failed to send email to ${signer.email}:`, emailError);
          }
        }
      }
    }
    
    res.json(result);
  } catch (error: any) {
    console.error("[ZapSign] Create document error:", error);
    res.status(500).json({ error: error.message || "Failed to create document" });
  }
});

app.get("/api/zapsign/documents/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const result = await zapsignService.getDocument(token);
    res.json(result);
  } catch (error: any) {
    console.error("[ZapSign] Get document error:", error);
    res.status(500).json({ error: error.message || "Failed to get document" });
  }
});

app.get("/api/zapsign/documents", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const result = await zapsignService.listDocuments(page);
    res.json(result);
  } catch (error: any) {
    console.error("[ZapSign] List documents error:", error);
    res.status(500).json({ error: error.message || "Failed to list documents" });
  }
});

app.delete("/api/zapsign/documents/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    await zapsignService.deleteDocument(token);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[ZapSign] Delete document error:", error);
    res.status(500).json({ error: error.message || "Failed to delete document" });
  }
});

// Persistence endpoints for ZapSign documents (via Supabase with service role)
app.post("/api/zapsign/db/documents", async (req: Request, res: Response) => {
  try {
    const docData = req.body;
    if (!docData.processo_id || !docData.nome) {
      return res.status(400).json({ error: "processo_id and nome are required" });
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/zapsign_documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY || "",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        ...docData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${errorText}`);
    }
    
    const result = await response.json();
    res.json(result[0] || result);
  } catch (error: any) {
    console.error("[ZapSign DB] Save document error:", error);
    res.status(500).json({ error: error.message || "Failed to save document" });
  }
});

app.get("/api/zapsign/db/documents/:processoId", async (req: Request, res: Response) => {
  try {
    const { processoId } = req.params;
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/zapsign_documents?processo_id=eq.${processoId}&order=created_at.desc`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY || "",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${errorText}`);
    }
    
    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error("[ZapSign DB] Get documents error:", error);
    res.status(500).json({ error: error.message || "Failed to get documents" });
  }
});

app.patch("/api/zapsign/db/documents/:docId", async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const updateData = req.body;
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/zapsign_documents?id=eq.${docId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY || "",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          ...updateData,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${errorText}`);
    }
    
    const result = await response.json();
    res.json(result[0] || result);
  } catch (error: any) {
    console.error("[ZapSign DB] Update document error:", error);
    res.status(500).json({ error: error.message || "Failed to update document" });
  }
});

app.post("/api/zapsign/build-signer", async (req: Request, res: Response) => {
  try {
    const { cliente, options } = req.body;
    if (!cliente || !cliente.nome) {
      return res.status(400).json({ error: "Cliente with nome is required" });
    }
    const signer = zapsignService.buildSignerFromCliente(cliente, options);
    res.json(signer);
  } catch (error: any) {
    console.error("[ZapSign] Build signer error:", error);
    res.status(500).json({ error: error.message || "Failed to build signer" });
  }
});

// Unified endpoint to get ALL signature documents (from both FaciliSign and Processos)
app.get("/api/zapsign/db/all-documents", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const allDocs: any[] = [];

    // Fetch from documentos_digitais (FaciliSign module - user's own documents)
    try {
      const faciliSignResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/documentos_digitais?order=created_at.desc&select=*`,
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY || "",
            "Authorization": authHeader,
          },
        }
      );
      if (faciliSignResponse.ok) {
        const faciliSignDocs = await faciliSignResponse.json();
        faciliSignDocs.forEach((doc: any) => {
          const webhookData = doc.webhook_data || {};
          allDocs.push({
            id: doc.id,
            nome: doc.nome,
            status: doc.status,
            zapsign_token: doc.docuseal_template_id || "",
            zapsign_open_id: doc.docuseal_submission_id,
            original_file_url: webhookData.original_file_url,
            signed_file_url: webhookData.signed_file_url,
            signatarios: doc.signatarios,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            source: "facilisign",
            processo_id: null,
            numero_processo: null,
          });
        });
      }
    } catch (e) {
      console.log("[ZapSign All] Error fetching FaciliSign docs:", e);
    }

    // Fetch from zapsign_documents (Processos Assinatura tab - user's own via RLS)
    try {
      const processosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/zapsign_documents?order=created_at.desc&select=*`,
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY || "",
            "Authorization": authHeader,
          },
        }
      );
      if (processosResponse.ok) {
        const processosDocs = await processosResponse.json();
        
        // Get process numbers for display
        const processIds = [...new Set(processosDocs.map((d: any) => d.processo_id).filter(Boolean))] as string[];
        let processosMap: Record<string, string> = {};
        
        if (processIds.length > 0) {
          const quotedIds = processIds.map((id) => `"${id}"`).join(",");
          const processInfoResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/processos?id=in.(${quotedIds})&select=id,numero_processo`,
            {
              headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY || "",
                "Authorization": authHeader,
              },
            }
          );
          if (processInfoResponse.ok) {
            const processInfo = await processInfoResponse.json();
            processInfo.forEach((p: any) => {
              processosMap[p.id] = p.numero_processo;
            });
          }
        }
        
        processosDocs.forEach((doc: any) => {
          allDocs.push({
            id: doc.id,
            nome: doc.nome,
            status: doc.status,
            zapsign_token: doc.zapsign_token || "",
            zapsign_open_id: doc.zapsign_open_id,
            original_file_url: doc.original_file_url,
            signed_file_url: doc.signed_file_url,
            signatarios: doc.signatarios,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            source: "processo",
            processo_id: doc.processo_id,
            numero_processo: processosMap[doc.processo_id] || null,
          });
        });
      }
    } catch (e) {
      console.log("[ZapSign All] Error fetching Processos docs:", e);
    }

    // Sort by created_at descending
    allDocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const paginatedDocs = allDocs.slice(startIndex, startIndex + pageSize);

    res.json({
      documents: paginatedDocs,
      total: allDocs.length,
      page,
      pageSize,
      totalPages: Math.ceil(allDocs.length / pageSize),
    });
  } catch (error: any) {
    console.error("[ZapSign All] Error:", error);
    res.status(500).json({ error: error.message || "Failed to get documents" });
  }
});

// Alerts API - consolidated endpoint for all alert types (shows ALL pending items)
app.get("/api/alerts", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    const alerts: any[] = [];

    // Fetch ALL pending tasks via Edge Function (same method that works in modal)
    try {
      const tasksResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/tasks-api?status=pending`,
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY || "",
            "Authorization": authHeader,
          },
        }
      );
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        
        // Get process info for tasks
        const processIds = [...new Set(tasks.map((t: any) => t.process_id).filter(Boolean))] as string[];
        let processosMap: Record<string, string> = {};
        
        if (processIds.length > 0) {
          const quotedIds = processIds.map((id) => `"${id}"`).join(",");
          const processosResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/processos?id=in.(${quotedIds})&select=id,numero_processo`,
            {
              headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY || "",
                "Authorization": authHeader,
              },
            }
          );
          if (processosResponse.ok) {
            const processos = await processosResponse.json();
            processos.forEach((p: any) => {
              processosMap[p.id] = p.numero_processo;
            });
          }
        }
        
        tasks.forEach((task: any) => {
          alerts.push({
            id: `tarefa-${task.id}`,
            type: "tarefa",
            title: task.title,
            description: task.description,
            date: task.due_date,
            priority: task.priority === "high" ? "alta" : task.priority === "medium" ? "media" : "baixa",
            status: task.status,
            processoId: task.process_id,
            processoNumero: processosMap[task.process_id] || null,
          });
        });
      } else {
        console.log("[Alerts] Tasks response not ok:", await tasksResponse.text());
      }
    } catch (e) {
      console.log("[Alerts] Error fetching tasks:", e);
    }

    // Fetch ALL process deadlines (no date filter)
    try {
      const processosResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/processos?status=eq.ATIVO&prazo=not.is.null&order=prazo.asc&select=id,numero_processo,titulo,prazo,status`,
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY || "",
            "Authorization": authHeader,
          },
        }
      );
      if (processosResponse.ok) {
        const processos = await processosResponse.json();
        processos.forEach((processo: any) => {
          if (processo.prazo) {
            alerts.push({
              id: `prazo-${processo.id}`,
              type: "prazo",
              title: `Prazo: ${processo.titulo || processo.numero_processo}`,
              description: processo.numero_processo,
              date: processo.prazo,
              processoId: processo.id,
              processoNumero: processo.numero_processo,
            });
          }
        });
      }
    } catch (e) {
      console.log("[Alerts] Error fetching processos:", e);
    }

    // Fetch ALL pending signatures from documentos_digitais (FaciliSign module)
    try {
      const signaturesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/documentos_digitais?status=eq.ENVIADO_PARA_ASSINATURA&order=created_at.desc&select=*`,
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY || "",
            "Authorization": authHeader,
          },
        }
      );
      if (signaturesResponse.ok) {
        const signatures = await signaturesResponse.json();
        signatures.forEach((doc: any) => {
          if (doc.created_at) {
            const signatarios = doc.signatarios || [];
            const signerNames = signatarios.map((s: any) => s.name || s.nome).filter(Boolean).join(", ");
            
            alerts.push({
              id: `assinatura-facilisign-${doc.id}`,
              type: "assinatura",
              title: doc.nome || "Documento para assinatura",
              description: signerNames ? `Signatarios: ${signerNames}` : "Aguardando assinatura (FaciliSign)",
              date: doc.created_at,
            });
          }
        });
      }
    } catch (e) {
      console.log("[Alerts] Error fetching FaciliSign signatures:", e);
    }

    // Fetch ALL pending signatures from zapsign_documents (Processos Assinatura tab)
    try {
      const processSignaturesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/zapsign_documents?status=in.(pending,ENVIADO_PARA_ASSINATURA)&order=created_at.desc&select=*`,
        {
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY || "",
            "Authorization": authHeader,
          },
        }
      );
      if (processSignaturesResponse.ok) {
        const processSignatures = await processSignaturesResponse.json();
        
        // Get process numbers for display
        const processIds = [...new Set(processSignatures.map((d: any) => d.processo_id).filter(Boolean))] as string[];
        let processosMap: Record<string, string> = {};
        
        if (processIds.length > 0) {
          const quotedIds = processIds.map((id) => `"${id}"`).join(",");
          const processInfoResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/processos?id=in.(${quotedIds})&select=id,numero_processo`,
            {
              headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY || "",
                "Authorization": authHeader,
              },
            }
          );
          if (processInfoResponse.ok) {
            const processInfo = await processInfoResponse.json();
            processInfo.forEach((p: any) => {
              processosMap[p.id] = p.numero_processo;
            });
          }
        }
        
        processSignatures.forEach((doc: any) => {
          if (doc.created_at) {
            const signatarios = doc.signatarios || [];
            const signerNames = signatarios.map((s: any) => s.name || s.nome).filter(Boolean).join(", ");
            const processoNumero = processosMap[doc.processo_id] || null;
            
            alerts.push({
              id: `assinatura-processo-${doc.id}`,
              type: "assinatura",
              title: doc.nome || "Documento para assinatura",
              description: signerNames 
                ? `Signatarios: ${signerNames}${processoNumero ? ` (Processo)` : ""}` 
                : `Aguardando assinatura${processoNumero ? ` (Processo)` : ""}`,
              date: doc.created_at,
              processoId: doc.processo_id,
              processoNumero: processoNumero,
            });
          }
        });
      }
    } catch (e) {
      console.log("[Alerts] Error fetching Processos signatures:", e);
    }

    res.json({ alerts });
  } catch (error: any) {
    console.error("[Alerts] Error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch alerts" });
  }
});

// ZapSign Webhook - receives document signature events
// Webhook URL for ZapSign configuration: https://[YOUR_DOMAIN]/api/zapsign/webhook
const ZAPSIGN_WEBHOOK_SECRET = process.env.ZAPSIGN_WEBHOOK_SECRET;

app.post("/api/zapsign/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Validate webhook secret if configured
    if (ZAPSIGN_WEBHOOK_SECRET) {
      const receivedSecret = req.headers["x-zapsign-secret"] || req.query.secret;
      if (receivedSecret !== ZAPSIGN_WEBHOOK_SECRET) {
        console.warn("[ZapSign Webhook] Invalid secret received");
        return res.status(401).json({ error: "Unauthorized" });
      }
    }
    
    // Validate required fields
    if (!payload || !payload.event_type) {
      console.warn("[ZapSign Webhook] Invalid payload - missing event_type");
      return res.status(400).json({ error: "Invalid payload" });
    }
    
    console.log("[ZapSign Webhook] Received event:", payload.event_type, "for doc:", payload.token);
    
    // Handle doc_signed event
    if (payload.event_type === "doc_signed") {
      const docToken = payload.token;
      const docStatus = payload.status;
      const signedFile = payload.signed_file;
      const signerWhoSigned = payload.signer_who_signed;
      
      if (!docToken) {
        console.warn("[ZapSign Webhook] Missing document token");
        return res.status(400).json({ error: "Missing document token" });
      }
      
      // Update document in our database
      try {
        const updateResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/zapsign_documents?zapsign_token=eq.${docToken}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "apikey": SUPABASE_ANON_KEY || "",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              status: docStatus,
              signed_file_url: signedFile,
              last_signer_name: signerWhoSigned?.name,
              last_signer_email: signerWhoSigned?.email,
              signed_at: signerWhoSigned?.signed_at,
              updated_at: new Date().toISOString(),
            }),
          }
        );
        
        if (updateResponse.ok) {
          console.log("[ZapSign Webhook] Document updated successfully:", docToken);
          
          // Fetch document with related data for notification
          const getResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/zapsign_documents?zapsign_token=eq.${docToken}&select=*,processos(numero_processo,cliente_id,clientes(nome,email))`,
            {
              headers: {
                "apikey": SUPABASE_ANON_KEY || "",
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              },
            }
          );
          
          if (getResponse.ok) {
            const docs = await getResponse.json();
            
            // Send email notification to document owner/lawyer
            if (docs && docs.length > 0) {
              const doc = docs[0];
              const clientName = doc.processos?.clientes?.nome || "Cliente";
              const signedAt = signerWhoSigned?.signed_at 
                ? new Date(signerWhoSigned.signed_at).toLocaleString("pt-BR")
                : new Date().toLocaleString("pt-BR");
              
              // Get user email from notify_email field or client email
              const notifyEmail = doc.notify_email || doc.processos?.clientes?.email;
              
              if (notifyEmail) {
                try {
                  await resendService.sendDocumentSignedNotification({
                    to: notifyEmail,
                    clientName: clientName,
                    documentName: doc.nome || payload.name || "Documento",
                    signerName: signerWhoSigned?.name || "Assinante",
                    signedAt: signedAt,
                  });
                  console.log(`[ZapSign Webhook] Signed notification sent to ${notifyEmail}`);
                } catch (emailError) {
                  console.error("[ZapSign Webhook] Failed to send signed notification:", emailError);
                }
              }
            }
          }
        } else {
          const errorText = await updateResponse.text();
          console.error("[ZapSign Webhook] Failed to update document:", errorText);
        }
      } catch (updateError) {
        console.error("[ZapSign Webhook] Database update error:", updateError);
      }
    }
    
    // Return 200 to acknowledge receipt
    res.status(200).json({ received: true, event_type: payload.event_type });
  } catch (error: any) {
    console.error("[ZapSign Webhook] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Google System Authentication Routes (shared across all users)
import * as googleSystemAuthService from "./services/googleSystemAuthService";

app.get("/api/google/system/status", async (req: Request, res: Response) => {
  try {
    const status = await googleSystemAuthService.getConnectionStatus();
    res.json(status);
  } catch (error: any) {
    console.error("[Google System] Status error:", error);
    res.json({ connected: false, error: error.message });
  }
});

app.get("/api/google/system/auth-url", async (req: Request, res: Response) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || req.hostname;
    const redirectUri = `${protocol}://${host}/api/google/system/callback`;
    
    console.log("[Google System] Generating auth URL with redirect_uri:", redirectUri);
    console.log("[Google System] Headers - protocol:", protocol, "host:", host);
    
    const authUrl = googleSystemAuthService.getAuthUrl(redirectUri);
    res.json({ authUrl, redirectUri });
  } catch (error: any) {
    console.error("[Google System] Auth URL error:", error);
    res.status(500).json({ error: error.message || "Failed to generate auth URL" });
  }
});

app.get("/api/google/system/callback", async (req: Request, res: Response) => {
  try {
    const { code, error: authError } = req.query;
    
    if (authError) {
      console.error("[Google System] OAuth error:", authError);
      return res.redirect("/?google_error=" + encodeURIComponent(authError as string));
    }
    
    if (!code) {
      return res.redirect("/?google_error=no_code");
    }
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || req.hostname;
    const redirectUri = `${protocol}://${host}/api/google/system/callback`;
    
    const tokens = await googleSystemAuthService.exchangeCodeForTokens(code as string, redirectUri);
    
    await googleSystemAuthService.connect(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date,
      tokens.email
    );
    
    console.log(`[Google System] Successfully connected as ${tokens.email}`);
    
    res.redirect("/?google_connected=true");
  } catch (error: any) {
    console.error("[Google System] Callback error:", error);
    res.redirect("/?google_error=" + encodeURIComponent(error.message || "connection_failed"));
  }
});

app.post("/api/google/system/disconnect", async (req: Request, res: Response) => {
  try {
    await googleSystemAuthService.disconnect();
    res.json({ success: true, message: "Google integration disconnected" });
  } catch (error: any) {
    console.error("[Google System] Disconnect error:", error);
    res.status(500).json({ error: error.message || "Failed to disconnect" });
  }
});

// Google Drive API Routes
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

app.get("/api/drive/status", async (req: Request, res: Response) => {
  try {
    const connected = await googleDriveService.isConnected();
    res.json({ connected });
  } catch (error: any) {
    console.error("[Google Drive] Status check error:", error);
    res.json({ connected: false, error: error.message });
  }
});

app.get("/api/drive/root-folder", async (req: Request, res: Response) => {
  try {
    const folderId = await googleDriveService.getOrCreateRootFolder();
    res.json({ folderId, folderName: "FACILITA ADV" });
  } catch (error: any) {
    console.error("[Google Drive] Root folder error:", error);
    res.status(500).json({ error: error.message || "Failed to get/create root folder" });
  }
});

app.get("/api/drive/process-folder/:numeroProcesso", async (req: Request, res: Response) => {
  try {
    const { numeroProcesso } = req.params;
    const folderId = await googleDriveService.getOrCreateProcessFolder(numeroProcesso);
    res.json({ folderId, numeroProcesso });
  } catch (error: any) {
    console.error("[Google Drive] Process folder error:", error);
    res.status(500).json({ error: error.message || "Failed to get/create process folder" });
  }
});

app.post("/api/drive/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { numeroProcesso, fileName } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    if (!numeroProcesso) {
      return res.status(400).json({ error: "numeroProcesso is required" });
    }
    
    const result = await googleDriveService.uploadFile(
      fileName || file.originalname,
      file.mimetype,
      file.buffer,
      numeroProcesso
    );
    
    res.json(result);
  } catch (error: any) {
    console.error("[Google Drive] Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload file" });
  }
});

app.post("/api/drive/upload-from-url", async (req: Request, res: Response) => {
  try {
    const { fileUrl, fileName, numeroProcesso } = req.body;
    
    if (!fileUrl || !fileName || !numeroProcesso) {
      return res.status(400).json({ error: "fileUrl, fileName, and numeroProcesso are required" });
    }
    
    const result = await googleDriveService.uploadFromUrl(fileUrl, fileName, numeroProcesso);
    res.json(result);
  } catch (error: any) {
    console.error("[Google Drive] Upload from URL error:", error);
    res.status(500).json({ error: error.message || "Failed to upload file from URL" });
  }
});

app.get("/api/drive/folder/:folderId/files", async (req: Request, res: Response) => {
  try {
    const { folderId } = req.params;
    const files = await googleDriveService.listFolderContents(folderId);
    res.json(files);
  } catch (error: any) {
    console.error("[Google Drive] List files error:", error);
    res.status(500).json({ error: error.message || "Failed to list files" });
  }
});

app.get("/api/drive/process-folders", async (req: Request, res: Response) => {
  try {
    const folders = await googleDriveService.listProcessFolders();
    res.json(folders);
  } catch (error: any) {
    console.error("[Google Drive] List process folders error:", error);
    res.status(500).json({ error: error.message || "Failed to list process folders" });
  }
});

app.delete("/api/drive/files/:fileId", async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    await googleDriveService.deleteFile(fileId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Google Drive] Delete file error:", error);
    res.status(500).json({ error: error.message || "Failed to delete file" });
  }
});

app.get("/api/drive/files/:fileId", async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await googleDriveService.getFileDetails(fileId);
    res.json(file);
  } catch (error: any) {
    console.error("[Google Drive] Get file details error:", error);
    res.status(500).json({ error: error.message || "Failed to get file details" });
  }
});

// Google Gmail API Routes (system-wide)
import * as googleGmailService from "./services/googleGmailService";

app.get("/api/gmail/status", async (req: Request, res: Response) => {
  try {
    const connected = await googleGmailService.isConnected();
    if (connected) {
      const profile = await googleGmailService.getProfile();
      res.json({ connected: true, email: profile.email });
    } else {
      res.json({ connected: false });
    }
  } catch (error: any) {
    console.error("[Gmail] Status error:", error);
    res.json({ connected: false, error: error.message });
  }
});

app.post("/api/gmail/send", async (req: Request, res: Response) => {
  try {
    const { to, subject, body, isHtml, cc, bcc, replyTo } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: "to, subject, and body are required" });
    }
    
    const result = await googleGmailService.sendEmail({
      to,
      subject,
      body,
      isHtml: isHtml ?? true,
      cc,
      bcc,
      replyTo,
    });
    
    res.json(result);
  } catch (error: any) {
    console.error("[Gmail] Send error:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

app.get("/api/gmail/messages", async (req: Request, res: Response) => {
  try {
    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const query = req.query.q as string;
    
    const messages = await googleGmailService.listMessages(maxResults, query);
    res.json(messages);
  } catch (error: any) {
    console.error("[Gmail] List messages error:", error);
    res.status(500).json({ error: error.message || "Failed to list messages" });
  }
});

app.get("/api/gmail/messages/:messageId", async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const message = await googleGmailService.getMessage(messageId);
    res.json(message);
  } catch (error: any) {
    console.error("[Gmail] Get message error:", error);
    res.status(500).json({ error: error.message || "Failed to get message" });
  }
});

// Google Calendar API Routes (system-wide)
import * as googleCalendarService from "./services/googleCalendarService";

app.get("/api/calendar/status", async (req: Request, res: Response) => {
  try {
    const connected = await googleCalendarService.isConnected();
    if (connected) {
      const info = await googleCalendarService.getCalendarInfo();
      res.json({ connected: true, ...info });
    } else {
      res.json({ connected: false });
    }
  } catch (error: any) {
    console.error("[Calendar] Status error:", error);
    res.json({ connected: false, error: error.message });
  }
});

app.get("/api/calendar/events", async (req: Request, res: Response) => {
  try {
    const { timeMin, timeMax, maxResults, q, facilitaOnly } = req.query;
    
    const options = {
      timeMin: timeMin as string,
      timeMax: timeMax as string,
      maxResults: maxResults ? parseInt(maxResults as string) : 50,
      query: q as string,
    };
    
    const events = facilitaOnly === 'true'
      ? await googleCalendarService.listFacilitaEvents(options)
      : await googleCalendarService.listEvents(options);
    
    res.json(events);
  } catch (error: any) {
    console.error("[Calendar] List events error:", error);
    res.status(500).json({ error: error.message || "Failed to list events" });
  }
});

app.post("/api/calendar/events", async (req: Request, res: Response) => {
  try {
    const { summary, description, location, startDateTime, endDateTime, attendees, colorId } = req.body;
    
    if (!summary || !startDateTime || !endDateTime) {
      return res.status(400).json({ error: "summary, startDateTime, and endDateTime are required" });
    }
    
    const event = await googleCalendarService.createEvent({
      summary,
      description,
      location,
      startDateTime,
      endDateTime,
      attendees,
      colorId,
    });
    
    res.json(event);
  } catch (error: any) {
    console.error("[Calendar] Create event error:", error);
    res.status(500).json({ error: error.message || "Failed to create event" });
  }
});

app.patch("/api/calendar/events/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { summary, description, location, startDateTime, endDateTime, attendees, colorId } = req.body;
    
    const event = await googleCalendarService.updateEvent({
      eventId,
      summary,
      description,
      location,
      startDateTime,
      endDateTime,
      attendees,
      colorId,
    });
    
    res.json(event);
  } catch (error: any) {
    console.error("[Calendar] Update event error:", error);
    res.status(500).json({ error: error.message || "Failed to update event" });
  }
});

app.delete("/api/calendar/events/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    await googleCalendarService.deleteEvent(eventId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Calendar] Delete event error:", error);
    res.status(500).json({ error: error.message || "Failed to delete event" });
  }
});

app.get("/api/calendar/events/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const event = await googleCalendarService.getEvent(eventId);
    res.json(event);
  } catch (error: any) {
    console.error("[Calendar] Get event error:", error);
    res.status(500).json({ error: error.message || "Failed to get event" });
  }
});

// Email Routes (via Resend - Replit Connector)
app.post("/api/email/send", async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text, replyTo } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({ error: "to, subject, and html are required" });
    }
    
    const result = await resendService.sendEmail({ to, subject, html, text, replyTo });
    res.json(result);
  } catch (error: any) {
    console.error("[Email] Send error:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

app.post("/api/email/document-signature", async (req: Request, res: Response) => {
  try {
    const { to, clientName, documentName, signerName, signatureUrl } = req.body;
    
    if (!to || !clientName || !documentName || !signerName || !signatureUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await resendService.sendDocumentSignatureRequest({
      to,
      clientName,
      documentName,
      signerName,
      signatureUrl,
    });
    res.json(result);
  } catch (error: any) {
    console.error("[Email] Document signature request error:", error);
    res.status(500).json({ error: error.message || "Failed to send signature request email" });
  }
});

app.post("/api/email/document-signed", async (req: Request, res: Response) => {
  try {
    const { to, clientName, documentName, signerName, signedAt } = req.body;
    
    if (!to || !clientName || !documentName || !signerName || !signedAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await resendService.sendDocumentSignedNotification({
      to,
      clientName,
      documentName,
      signerName,
      signedAt,
    });
    res.json(result);
  } catch (error: any) {
    console.error("[Email] Document signed notification error:", error);
    res.status(500).json({ error: error.message || "Failed to send signed notification email" });
  }
});

app.post("/api/email/deadline-reminder", async (req: Request, res: Response) => {
  try {
    const { to, processNumber, clientName, deadline, description, daysRemaining } = req.body;
    
    if (!to || !processNumber || !clientName || !deadline || !description || daysRemaining === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await resendService.sendDeadlineReminder({
      to,
      processNumber,
      clientName,
      deadline,
      description,
      daysRemaining,
    });
    res.json(result);
  } catch (error: any) {
    console.error("[Email] Deadline reminder error:", error);
    res.status(500).json({ error: error.message || "Failed to send deadline reminder email" });
  }
});

app.post("/api/email/payment-reminder", async (req: Request, res: Response) => {
  try {
    const { to, clientName, amount, dueDate, description } = req.body;
    
    if (!to || !clientName || !amount || !dueDate || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await resendService.sendPaymentReminder({
      to,
      clientName,
      amount,
      dueDate,
      description,
    });
    res.json(result);
  } catch (error: any) {
    console.error("[Email] Payment reminder error:", error);
    res.status(500).json({ error: error.message || "Failed to send payment reminder email" });
  }
});

app.post("/api/email/user-invitation", async (req: Request, res: Response) => {
  try {
    const { to, recipientName, inviterName, permissions, acceptUrl } = req.body;
    
    if (!to || !recipientName || !inviterName || !permissions || !acceptUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await resendService.sendUserInvitation({
      to,
      recipientName,
      inviterName,
      permissions,
      acceptUrl,
    });
    res.json(result);
  } catch (error: any) {
    console.error("[Email] User invitation error:", error);
    res.status(500).json({ error: error.message || "Failed to send invitation email" });
  }
});

app.post("/api/email/task-reminder", async (req: Request, res: Response) => {
  try {
    const { to, taskTitle, processNumber, clientName, dueDate, daysRemaining } = req.body;
    
    if (!to || !taskTitle || !processNumber || !clientName || !dueDate || daysRemaining === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = await resendService.sendTaskReminder({
      to,
      taskTitle,
      processNumber,
      clientName,
      dueDate,
      daysRemaining,
    });
    res.json(result);
  } catch (error: any) {
    console.error("[Email] Task reminder error:", error);
    res.status(500).json({ error: error.message || "Failed to send task reminder email" });
  }
});

// Batch notification endpoints - for sending reminders to multiple recipients
// These endpoints require authentication and check the database for items expiring soon
// Authentication middleware for notification endpoints
const requireAuth = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const token = authHeader.substring(7);
  
  // Verify token with Supabase
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON_KEY || "",
      },
    });
    
    if (!response.ok) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    const user = await response.json();
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// Send deadline reminders for processes with upcoming deadlines
app.post("/api/notifications/send-deadline-reminders", requireAuth, async (req: Request, res: Response) => {
  try {
    const { daysAhead = 3, notifyEmail } = req.body;
    
    if (!notifyEmail) {
      return res.status(400).json({ error: "notifyEmail is required" });
    }
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    // Fetch processes with deadlines in the next X days
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/processos?prazo=gte.${today.toISOString().split('T')[0]}&prazo=lte.${futureDate.toISOString().split('T')[0]}&status=eq.ATIVO&select=id,numero_processo,prazo,observacoes,clientes(nome,email)`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY || "",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch processes with deadlines");
    }
    
    const processes = await response.json();
    const emailsSent: string[] = [];
    const errors: string[] = [];
    
    for (const processo of processes) {
      const prazoDate = new Date(processo.prazo);
      const daysRemaining = Math.ceil((prazoDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      try {
        await resendService.sendDeadlineReminder({
          to: notifyEmail,
          processNumber: processo.numero_processo || "Sem numero",
          clientName: processo.clientes?.nome || "Cliente",
          deadline: prazoDate.toLocaleDateString("pt-BR"),
          description: processo.observacoes || "Prazo processual",
          daysRemaining,
        });
        emailsSent.push(processo.numero_processo);
      } catch (err: any) {
        errors.push(`${processo.numero_processo}: ${err.message}`);
      }
    }
    
    res.json({ 
      success: true, 
      processesFound: processes.length,
      emailsSent: emailsSent.length,
      emails: emailsSent,
      errors 
    });
  } catch (error: any) {
    console.error("[Notifications] Deadline reminders error:", error);
    res.status(500).json({ error: error.message || "Failed to send deadline reminders" });
  }
});

// Send payment reminders for upcoming financial entries
app.post("/api/notifications/send-payment-reminders", requireAuth, async (req: Request, res: Response) => {
  try {
    const { daysAhead = 3 } = req.body;
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    // Fetch upcoming payments (recebimentos pendentes)
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/financeiro?data_vencimento=gte.${today.toISOString().split('T')[0]}&data_vencimento=lte.${futureDate.toISOString().split('T')[0]}&status=eq.pendente&tipo=eq.recebimento&select=*,clientes(nome,email)`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY || "",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch pending payments");
    }
    
    const payments = await response.json();
    const emailsSent: string[] = [];
    const errors: string[] = [];
    
    for (const payment of payments) {
      const clientEmail = payment.clientes?.email;
      if (!clientEmail) continue;
      
      try {
        await resendService.sendPaymentReminder({
          to: clientEmail,
          clientName: payment.clientes?.nome || "Cliente",
          amount: `R$ ${parseFloat(payment.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          dueDate: new Date(payment.data_vencimento).toLocaleDateString("pt-BR"),
          description: payment.descricao || "Honorarios advocaticios",
        });
        emailsSent.push(clientEmail);
      } catch (err: any) {
        errors.push(`${clientEmail}: ${err.message}`);
      }
    }
    
    res.json({ 
      success: true, 
      paymentsFound: payments.length,
      emailsSent: emailsSent.length,
      emails: emailsSent,
      errors 
    });
  } catch (error: any) {
    console.error("[Notifications] Payment reminders error:", error);
    res.status(500).json({ error: error.message || "Failed to send payment reminders" });
  }
});

// Send task reminders for pending tasks with upcoming due dates
app.post("/api/notifications/send-task-reminders", requireAuth, async (req: Request, res: Response) => {
  try {
    const { daysAhead = 3, notifyEmail } = req.body;
    
    if (!notifyEmail) {
      return res.status(400).json({ error: "notifyEmail is required" });
    }
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    // Fetch pending tasks via Edge Function proxy
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/tasks?status=eq.pending&due_date=gte.${today.toISOString().split('T')[0]}&due_date=lte.${futureDate.toISOString().split('T')[0]}&select=*,processos(numero_processo,clientes(nome))`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY || "",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch pending tasks");
    }
    
    const tasks = await response.json();
    const emailsSent: string[] = [];
    const errors: string[] = [];
    
    for (const task of tasks) {
      const dueDate = new Date(task.due_date);
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      try {
        await resendService.sendTaskReminder({
          to: notifyEmail,
          taskTitle: task.title || "Tarefa",
          processNumber: task.processos?.numero_processo || "Sem processo",
          clientName: task.processos?.clientes?.nome || "Cliente",
          dueDate: dueDate.toLocaleDateString("pt-BR"),
          daysRemaining,
        });
        emailsSent.push(task.title);
      } catch (err: any) {
        errors.push(`${task.title}: ${err.message}`);
      }
    }
    
    res.json({ 
      success: true, 
      tasksFound: tasks.length,
      emailsSent: emailsSent.length,
      tasks: emailsSent,
      errors 
    });
  } catch (error: any) {
    console.error("[Notifications] Task reminders error:", error);
    res.status(500).json({ error: error.message || "Failed to send task reminders" });
  }
});

// Combined endpoint to send all reminders at once
app.post("/api/notifications/send-all-reminders", requireAuth, async (req: Request, res: Response) => {
  try {
    const { daysAhead = 3, notifyEmail } = req.body;
    
    if (!notifyEmail) {
      return res.status(400).json({ error: "notifyEmail is required" });
    }
    
    const results = {
      deadlines: { sent: 0, errors: [] as string[] },
      payments: { sent: 0, errors: [] as string[] },
      tasks: { sent: 0, errors: [] as string[] },
    };
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    // 1. Process deadlines
    try {
      const deadlineResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/processos?prazo=gte.${today.toISOString().split('T')[0]}&prazo=lte.${futureDate.toISOString().split('T')[0]}&status=eq.ATIVO&select=id,numero_processo,prazo,observacoes,clientes(nome)`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY || "",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      if (deadlineResponse.ok) {
        const processes = await deadlineResponse.json();
        for (const processo of processes) {
          const prazoDate = new Date(processo.prazo);
          const daysRemaining = Math.ceil((prazoDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          try {
            await resendService.sendDeadlineReminder({
              to: notifyEmail,
              processNumber: processo.numero_processo || "Sem numero",
              clientName: processo.clientes?.nome || "Cliente",
              deadline: prazoDate.toLocaleDateString("pt-BR"),
              description: processo.observacoes || "Prazo processual",
              daysRemaining,
            });
            results.deadlines.sent++;
          } catch (err: any) {
            results.deadlines.errors.push(err.message);
          }
        }
      }
    } catch (e) {
      console.error("[Notifications] Deadline fetch error:", e);
    }
    
    // 2. Process payments (send to clients)
    try {
      const paymentResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/financeiro?data_vencimento=gte.${today.toISOString().split('T')[0]}&data_vencimento=lte.${futureDate.toISOString().split('T')[0]}&status=eq.pendente&tipo=eq.recebimento&select=*,clientes(nome,email)`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY || "",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      if (paymentResponse.ok) {
        const payments = await paymentResponse.json();
        for (const payment of payments) {
          const clientEmail = payment.clientes?.email;
          if (!clientEmail) continue;
          try {
            await resendService.sendPaymentReminder({
              to: clientEmail,
              clientName: payment.clientes?.nome || "Cliente",
              amount: `R$ ${parseFloat(payment.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              dueDate: new Date(payment.data_vencimento).toLocaleDateString("pt-BR"),
              description: payment.descricao || "Honorarios advocaticios",
            });
            results.payments.sent++;
          } catch (err: any) {
            results.payments.errors.push(err.message);
          }
        }
      }
    } catch (e) {
      console.error("[Notifications] Payment fetch error:", e);
    }
    
    // 3. Process tasks
    try {
      const taskResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/tasks?status=eq.pending&due_date=gte.${today.toISOString().split('T')[0]}&due_date=lte.${futureDate.toISOString().split('T')[0]}&select=*,processos(numero_processo,clientes(nome))`,
        {
          headers: {
            "apikey": SUPABASE_ANON_KEY || "",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      if (taskResponse.ok) {
        const tasks = await taskResponse.json();
        for (const task of tasks) {
          const dueDate = new Date(task.due_date);
          const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          try {
            await resendService.sendTaskReminder({
              to: notifyEmail,
              taskTitle: task.title || "Tarefa",
              processNumber: task.processos?.numero_processo || "Sem processo",
              clientName: task.processos?.clientes?.nome || "Cliente",
              dueDate: dueDate.toLocaleDateString("pt-BR"),
              daysRemaining,
            });
            results.tasks.sent++;
          } catch (err: any) {
            results.tasks.errors.push(err.message);
          }
        }
      }
    } catch (e) {
      console.error("[Notifications] Task fetch error:", e);
    }
    
    res.json({ 
      success: true, 
      summary: {
        deadlinesSent: results.deadlines.sent,
        paymentsSent: results.payments.sent,
        tasksSent: results.tasks.sent,
        totalSent: results.deadlines.sent + results.payments.sent + results.tasks.sent,
      },
      details: results,
    });
  } catch (error: any) {
    console.error("[Notifications] Send all reminders error:", error);
    res.status(500).json({ error: error.message || "Failed to send reminders" });
  }
});

// Proxy para Edge Functions do Supabase (evita problemas de CORS)
app.all("/api/supabase/functions/:functionName", async (req: Request, res: Response) => {
  try {
    const { functionName } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }

    // Build URL with query params
    let url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const options: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "apikey": SUPABASE_ANON_KEY,
      },
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.text();

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "content-encoding" && key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    });
    res.send(data);
  } catch (error: any) {
    console.error("[Proxy] Error:", error);
    res.status(500).json({ error: error.message || "Proxy error" });
  }
});

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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

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
  });
})();
