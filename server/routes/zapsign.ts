import { Router, type Request, type Response } from "express";
import * as zapsignService from "../services/zapsignService";
import * as resendService from "../services/resendService";
import type { ZapsignCreateDocRequest } from "@shared/schema";

const router = Router();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ZAPSIGN_WEBHOOK_SECRET = process.env.ZAPSIGN_WEBHOOK_SECRET;

// Create document
router.post("/documents", async (req: Request, res: Response) => {
    try {
        const { clientName, notifyEmail, useOneClick = true, ...docRequest } = req.body;

        if (!docRequest.name || !docRequest.signers || docRequest.signers.length === 0) {
            return res.status(400).json({ error: "Name and at least one signer are required" });
        }

        if (!docRequest.url_pdf && !docRequest.base64_pdf && !docRequest.url_docx && !docRequest.base64_docx) {
            return res.status(400).json({ error: "Either url_pdf, base64_pdf, url_docx or base64_docx is required" });
        }

        // Choose API based on useOneClick flag
        let result;
        if (useOneClick) {
            // OneClick API
            result = await zapsignService.createDocumentOneClick({
                ...docRequest,
                one_click_active: true,
            });
        } else {
            // Standard API (backward compatibility)
            result = await zapsignService.createDocument(docRequest);
        }

        // Only send custom emails if:
        // 1. notifyEmail is not explicitly false AND
        // 2. ZapSign is NOT sending automatic emails (send_automatic_email !== true)
        const shouldSendCustomEmail = notifyEmail !== false &&
            !docRequest.signers.some((s: any) => s.send_automatic_email === true);

        if (shouldSendCustomEmail && result.signers && result.signers.length > 0) {
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
                        console.log(`[ZapSign] Custom email notification sent to ${signer.email}`);
                    } catch (emailError) {
                        console.error(`[ZapSign] Failed to send custom email to ${signer.email}:`, emailError);
                    }
                }
            }
        } else if (!shouldSendCustomEmail) {
            console.log(`[ZapSign] Skipping custom emails - ZapSign will send automatic emails`);
        }

        res.json(result);
    } catch (error: any) {
        console.error("[ZapSign] Create document error:", error);
        res.status(500).json({ error: error.message || "Failed to create document" });
    }
});

// Get document
router.get("/documents/:token", async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const result = await zapsignService.getDocument(token);
        res.json(result);
    } catch (error: any) {
        console.error("[ZapSign] Get document error:", error);
        res.status(500).json({ error: error.message || "Failed to get document" });
    }
});

// List documents
router.get("/documents", async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const result = await zapsignService.listDocuments(page);
        res.json(result);
    } catch (error: any) {
        console.error("[ZapSign] List documents error:", error);
        res.status(500).json({ error: error.message || "Failed to list documents" });
    }
});

// Delete document (from ZapSign API and database)
router.delete("/documents/:token", async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log(`[ZapSign DELETE] Starting deletion for token: ${token}`);

        // 1. Delete from ZapSign API
        try {
            await zapsignService.deleteDocument(token);
            console.log(`[ZapSign DELETE] ✅ Deleted from ZapSign API`);
        } catch (apiError: any) {
            console.warn(`[ZapSign DELETE] ⚠️ ZapSign API delete failed (continuing):`, apiError.message);
        }

        // 2. Delete from database (zapsign_documents) - CRITICAL!
        console.log(`[ZapSign DELETE] Deleting from database...`);

        const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/zapsign_documents?zapsign_token=eq.${token}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_SERVICE_KEY || "",
                "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
            }
        });

        if (!deleteRes.ok) {
            const error = await deleteRes.text();
            console.error(`[ZapSign DELETE] ❌ Database delete failed:`, error);
            throw new Error(`Database deletion failed: ${error}`);
        }

        console.log(`[ZapSign DELETE] ✅ Deleted from database (zapsign_documents)`);

        res.json({ success: true, message: "Document deleted from ZapSign and database" });
    } catch (error: any) {
        console.error("[ZapSign DELETE] Error:", error);
        res.status(500).json({ error: error.message || "Failed to delete document" });
    }
});

// DB Persistence
router.post("/db/documents", async (req: Request, res: Response) => {
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

router.get("/db/documents/:processoId", async (req: Request, res: Response) => {
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

router.patch("/db/documents/:docId", async (req: Request, res: Response) => {
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

router.post("/build-signer", async (req: Request, res: Response) => {
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

// Unified endpoint for ALL signature docs
router.get("/db/all-documents", async (req: Request, res: Response) => {
    try {
        const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
        const authHeader = req.headers.authorization || "";

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;

        const allDocs: any[] = [];

        // Fetch from zapsign_documents (única tabela agora)
        try {
            const faciliSignResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/zapsign_documents?order=created_at.desc&select=*`,
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
                        source: "facilisign",
                        processo_id: doc.processo_id,
                        numero_processo: null,
                    });
                });
            }
        } catch (e) {
            console.log("[ZapSign All] Error fetching docs:", e);
        }

        // Buscar processos vinculados para cada documento
        const tokensToCheck = allDocs
            .filter(d => d.zapsign_token)
            .map(d => d.zapsign_token);

        let linkedProcessesMap: Record<string, Array<{ id: string; numero: string }>> = {};

        if (tokensToCheck.length > 0) {
            try {
                // Buscar documentos_processo que têm zapsign_token
                const quotedTokens = tokensToCheck.map(t => `"${t}"`).join(",");
                const docProcessosResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/documentos_processo?zapsign_token=in.(${quotedTokens})&select=zapsign_token,processo_id`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "apikey": SUPABASE_ANON_KEY || "",
                            "Authorization": authHeader,
                        },
                    }
                );

                if (docProcessosResponse.ok) {
                    const docProcessos = await docProcessosResponse.json();

                    // Agrupar por token
                    const processoIdsByToken: Record<string, string[]> = {};
                    docProcessos.forEach((dp: any) => {
                        if (!processoIdsByToken[dp.zapsign_token]) {
                            processoIdsByToken[dp.zapsign_token] = [];
                        }
                        if (dp.processo_id && !processoIdsByToken[dp.zapsign_token].includes(dp.processo_id)) {
                            processoIdsByToken[dp.zapsign_token].push(dp.processo_id);
                        }
                    });

                    // Buscar números dos processos
                    const allProcessoIds = [...new Set(Object.values(processoIdsByToken).flat())];
                    if (allProcessoIds.length > 0) {
                        const quotedProcessoIds = allProcessoIds.map(id => `"${id}"`).join(",");
                        const processosResponse = await fetch(
                            `${SUPABASE_URL}/rest/v1/processos?id=in.(${quotedProcessoIds})&select=id,numero_processo`,
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
                            const processosById: Record<string, string> = {};
                            processos.forEach((p: any) => {
                                processosById[p.id] = p.numero_processo;
                            });

                            // Montar linked_processes para cada token
                            Object.keys(processoIdsByToken).forEach(token => {
                                linkedProcessesMap[token] = processoIdsByToken[token].map(pid => ({
                                    id: pid,
                                    numero: processosById[pid] || "Sem número"
                                }));
                            });
                        }
                    }
                }
            } catch (e) {
                console.log("[ZapSign All] Error fetching linked processes:", e);
            }
        }

        // Adicionar linked_processes a cada documento
        allDocs.forEach(doc => {
            doc.linked_processes = linkedProcessesMap[doc.zapsign_token] || [];
        });

        // Sort by date
        allDocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Pagination
        const startIndex = (page - 1) * pageSize;
        const paginatedDocs = allDocs.slice(startIndex, startIndex + pageSize);

        // Disable cache to prevent 304 responses
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

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

// Webhook
router.post("/webhook", async (req: Request, res: Response) => {
    try {
        const payload = req.body;

        if (ZAPSIGN_WEBHOOK_SECRET) {
            const receivedSecret = req.headers["x-zapsign-secret"] || req.query.secret;
            if (receivedSecret !== ZAPSIGN_WEBHOOK_SECRET) {
                console.warn("[ZapSign Webhook] Invalid secret received");
                return res.status(401).json({ error: "Unauthorized" });
            }
        }

        if (!payload || !payload.event_type) {
            console.warn("[ZapSign Webhook] Invalid payload - missing event_type");
            return res.status(400).json({ error: "Invalid payload" });
        }

        console.log("[ZapSign Webhook] Received event:", payload.event_type, "for doc:", payload.token);

        if (payload.event_type === "doc_signed") {
            const docToken = payload.token;
            const docStatus = payload.status;
            const signedFile = payload.signed_file;
            const signerWhoSigned = payload.signer_who_signed;

            if (!docToken) {
                console.warn("[ZapSign Webhook] Missing document token");
                return res.status(400).json({ error: "Missing document token" });
            }

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

                        if (docs && docs.length > 0) {
                            const doc = docs[0];
                            const clientName = doc.processos?.clientes?.nome || "Cliente";
                            const signedAt = signerWhoSigned?.signed_at
                                ? new Date(signerWhoSigned.signed_at).toLocaleString("pt-BR")
                                : new Date().toLocaleString("pt-BR");

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
                }
            } catch (updateError) {
                console.error("[ZapSign Webhook] Database update error:", updateError);
            }
        }

        res.status(200).json({ received: true, event_type: payload.event_type });
    } catch (error: any) {
        console.error("[ZapSign Webhook] Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE /api/zapsign/documents/:token
// Deletar documento do ZapSign e do banco de dados
router.delete("/documents/:token", async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: "Token é obrigatório" });
        }

        // 1. Deletar do ZapSign primeiro
        try {
            await zapsignService.deleteDocument(token);
            console.log(`[ZapSign Delete] Document ${token} deleted from ZapSign successfully`);
        } catch (zapSignError: any) {
            // Se falhar no ZapSign, continuar para deletar do banco
            // (pode já ter sido deletado manualmente na plataforma)
            console.warn(`[ZapSign Delete] Failed to delete from ZapSign:`, zapSignError.message);
        }

        // 2. Deletar do banco de dados (tabela correta: zapsign_documents)
        const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log(`[ZapSign Delete] Attempting to delete from DB: token=${token}`);

        const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/zapsign_documents?zapsign_token=eq.${token}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_SERVICE_KEY || "",
                "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                "Prefer": "return=minimal"
            }
        });

        console.log(`[ZapSign Delete] DB response status: ${deleteRes.status}`);

        if (!deleteRes.ok) {
            const error = await deleteRes.text();
            console.error("[ZapSign Delete] Database error:", error);
            return res.status(500).json({ error: "Erro ao deletar do banco de dados" });
        }

        console.log(`[ZapSign Delete] Document ${token} deleted from zapsign_documents successfully`);

        res.json({
            success: true,
            message: "Documento deletado com sucesso"
        });
    } catch (error: any) {
        console.error("[ZapSign Delete] Error:", error);
        res.status(500).json({
            error: error.message || "Erro ao deletar documento"
        });
    }
});

// POST /api/zapsign/documents/:token/link-to-process
// Vincular documento totalmente assinado a um processo
router.post("/documents/:token/link-to-process", async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { processoId } = req.body;

        if (!processoId) {
            return res.status(400).json({ error: "processoId é obrigatório" });
        }

        // 1. Buscar documento no ZapSign
        const zapSignDoc = await zapsignService.getDocument(token);

        // 2. Validar que está totalmente assinado
        if (zapSignDoc.status !== "signed" || !zapSignDoc.signed_file) {
            return res.status(400).json({
                error: "Documento ainda não está totalmente assinado",
                status: zapSignDoc.status,
            });
        }

        // 3. Buscar processo via SERVICE_KEY (ignorar RLS)
        const processoRes = await fetch(`${SUPABASE_URL}/rest/v1/processos?id=eq.${processoId}&select=numero_processo`, {
            headers: {
                "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY || "",
                "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            }
        });
        const processos = await processoRes.json();
        const processo = processos[0];

        if (!processo) {
            return res.status(404).json({ error: "Processo não encontrado" });
        }

        // 4. Upload para Google Drive usando URL do signed_file
        const googleDriveService = await import("../services/googleDriveService");
        const fileName = `ASSINADO - ${zapSignDoc.name}.pdf`;

        const driveResult = await googleDriveService.uploadFromUrl(
            zapSignDoc.signed_file,
            fileName,
            processo.numero_processo
        );

        // 5. Obter user_id do auth header
        const authHeader = req.headers.authorization;
        let userId = null;
        if (authHeader) {
            const userToken = authHeader.replace("Bearer ", "");
            const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: {
                    "apikey": SUPABASE_ANON_KEY || "",
                    "Authorization": authHeader,
                }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                userId = userData?.id;
            }
        }

        // 6. Salvar em documentos_processo
        const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/documentos_processo`, {
            method: "POST",
            headers: {
                "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY || "",
                "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify({
                processo_id: processoId,
                nome_arquivo: fileName,
                url_arquivo: zapSignDoc.signed_file,
                tipo_arquivo: "application/pdf",
                tamanho_arquivo: 0, // Unknown from ZapSign
                cliente_nome: "", // Will be populated via join if needed
                google_drive_link: driveResult.webViewLink,
                google_drive_file_id: driveResult.fileId,
                assinado_digitalmente: true,
                zapsign_token: token,
                user_id: userId,
            })
        });

        if (!saveRes.ok) {
            const error = await saveRes.json();
            console.error("[ZapSign Link] Error saving to documentos_processo:", error);
            return res.status(500).json({ error: "Erro ao salvar documento no banco de dados" });
        }

        const documentoSalvo = await saveRes.json();

        console.log(`[ZapSign Link] Document ${token} linked to process ${processoId}`);

        // Retornar sucesso
        const savedDoc = Array.isArray(documentoSalvo) ? documentoSalvo[0] : documentoSalvo;
        res.status(200).json({
            message: "Documento vinculado ao processo com sucesso",
            documentoId: savedDoc.id,
            processoId: processo.id,
            numeroProcesso: processo.numero_processo, // Adiciona número do processo na resposta
            driveLink: driveResult.webViewLink,
        });
    } catch (error: any) {
        console.error("[ZapSign Link] Error:", error);
        res.status(500).json({
            error: error.message || "Erro ao vincular documento ao processo",
        });
    }
});

// POST /api/zapsign/documents/:token/resend-emails
// Reenviar emails para signatários selecionados (pendentes)
router.post("/documents/:token/resend-emails", async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { signerEmails } = req.body as { signerEmails?: string[] };

        if (!signerEmails || signerEmails.length === 0) {
            return res.status(400).json({ error: "signerEmails é obrigatório" });
        }

        // 1. Buscar documento no ZapSign
        const doc = await zapsignService.getDocument(token);

        // 2. Filtrar signatários pendentes nos emails especificados  
        // Status válidos: new, pending, link-opened (viu mas não assinou)
        const pendingSigners = doc.signers.filter((s: any) =>
            (s.status === 'new' || s.status === 'pending' || s.status === 'link-opened') &&
            signerEmails.includes(s.email)
        );

        if (pendingSigners.length === 0) {
            return res.status(400).json({
                error: "Nenhum signatário pendente encontrado nos emails fornecidos"
            });
        }

        // 3. Reenviar emails via ZapSign API (automáticos)
        let emailsSent = 0;
        const errors: string[] = [];

        for (const signer of pendingSigners) {
            try {
                // Chamar API ZapSign para reenviar email automático
                const resendUrl = `https://api.zapsign.com.br/api/v1/docs/${token}/send-signer-email/${signer.token}/`;

                const response = await fetch(resendUrl, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.ZAPSIGN_API_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(`ZapSign API returned ${response.status}`);
                }

                emailsSent++;
                console.log(`[Resend Emails] ✅ ZapSign resent to ${signer.email}`);
            } catch (error: any) {
                console.error(`[Resend Emails] ❌ Failed to resend to ${signer.email}:`, error.message);
                errors.push(signer.email);
            }
        }

        res.json({
            success: true,
            emailsSent,
            totalRequested: signerEmails.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error: any) {
        console.error("[Resend Emails] Error:", error);
        res.status(500).json({ error: error.message || "Erro ao reenviar emails" });
    }
});

export default router;
