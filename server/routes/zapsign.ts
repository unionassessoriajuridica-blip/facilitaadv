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
        const docRequest: ZapsignCreateDocRequest = req.body;
        const { clientName, notifyEmail } = req.body;

        if (!docRequest.name || !docRequest.signers || docRequest.signers.length === 0) {
            return res.status(400).json({ error: "Name and at least one signer are required" });
        }

        if (!docRequest.url_pdf && !docRequest.base64_pdf) {
            return res.status(400).json({ error: "Either url_pdf or base64_pdf is required" });
        }

        const result = await zapsignService.createDocument(docRequest);

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

// Delete document
router.delete("/documents/:token", async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        await zapsignService.deleteDocument(token);
        res.json({ success: true });
    } catch (error: any) {
        console.error("[ZapSign] Delete document error:", error);
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
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization header required" });
        }

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;

        const allDocs: any[] = [];

        // Fetch from documentos_digitais
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

        // Fetch from zapsign_documents
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

        allDocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

export default router;
