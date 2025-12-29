import { Router } from "express";

const router = Router();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

router.get("/", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

        const alerts: any[] = [];

        // Fetch tasks directly from Supabase REST API (not Edge Function)
        try {
            const tasksResponse = await fetch(`${SUPABASE_URL}/rest/v1/tasks?status=eq.pending&order=due_date.asc&select=*`, {
                headers: {
                    "apikey": SUPABASE_SERVICE_KEY || "",
                    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                    "Prefer": "return=representation"
                },
            });
            if (tasksResponse.ok) {
                const tasks = await tasksResponse.json();
                const processIds = [...new Set(tasks.map((t: any) => t.process_id).filter(Boolean))] as string[];
                let processosMap: Record<string, string> = {};
                if (processIds.length > 0) {
                    const quotedIds = processIds.map(id => `"${id}"`).join(",");
                    const pInfoRes = await fetch(`${SUPABASE_URL}/rest/v1/processos?id=in.(${quotedIds})&select=id,numero_processo`, {
                        headers: { "apikey": SUPABASE_SERVICE_KEY || "", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
                    });
                    if (pInfoRes.ok) {
                        (await pInfoRes.json()).forEach((p: any) => { processosMap[p.id] = p.numero_processo; });
                    }
                }
                tasks.forEach((task: any) => {
                    alerts.push({
                        id: `tarefa-${task.id}`, type: "tarefa", title: task.title, description: task.description,
                        date: task.due_date, priority: task.priority === "high" ? "alta" : task.priority === "medium" ? "media" : "baixa",
                        status: task.status, processoId: task.process_id, processoNumero: processosMap[task.process_id] || null,
                    });
                });
            }
        } catch (e) { console.log("[Alerts] Error tasks:", e); }

        // Fetch deadlines
        try {
            const procRes = await fetch(`${SUPABASE_URL}/rest/v1/processos?status=eq.ATIVO&prazo=not.is.null&order=prazo.asc&select=id,numero_processo,titulo,prazo,status`, {
                headers: { "apikey": SUPABASE_SERVICE_KEY || "", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
            });
            if (procRes.ok) {
                (await procRes.json()).forEach((p: any) => {
                    alerts.push({ id: `prazo-${p.id}`, type: "prazo", title: `Prazo: ${p.titulo || p.numero_processo}`, description: p.numero_processo, date: p.prazo, processoId: p.id, processoNumero: p.numero_processo });
                });
            }
        } catch (e) { console.log("[Alerts] Error proc:", e); }

        // Fetch signatures (FaciliSign) from zapsign_documents
        try {
            const sigRes = await fetch(`${SUPABASE_URL}/rest/v1/zapsign_documents?status=eq.pending&order=created_at.desc&select=*`, {
                headers: { "apikey": SUPABASE_SERVICE_KEY || "", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
            });
            if (sigRes.ok) {
                (await sigRes.json()).forEach((doc: any) => {
                    const signerNames = (doc.signatarios || []).map((s: any) => s.name || s.nome).filter(Boolean).join(", ");
                    alerts.push({ id: `assinatura-facilisign-${doc.id}`, type: "assinatura", title: doc.nome || "Documento", description: signerNames ? `Signatários: ${signerNames}` : "Aguardando assinatura", date: doc.created_at });
                });
            }
        } catch (e) { console.log("[Alerts] Error facilisign sig:", e); }

        // Fetch signatures (Processos)
        try {
            const procSigRes = await fetch(`${SUPABASE_URL}/rest/v1/zapsign_documents?status=in.(pending,ENVIADO_PARA_ASSINATURA)&order=created_at.desc&select=*`, {
                headers: { "apikey": SUPABASE_SERVICE_KEY || "", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
            });
            if (procSigRes.ok) {
                const sigs = await procSigRes.json();
                const pIds = [...new Set(sigs.map((d: any) => d.processo_id).filter(Boolean))] as string[];
                let pMap: Record<string, string> = {};
                if (pIds.length > 0) {
                    const qIds = pIds.map(id => `"${id}"`).join(",");
                    const piRes = await fetch(`${SUPABASE_URL}/rest/v1/processos?id=in.(${qIds})&select=id,numero_processo`, {
                        headers: { "apikey": SUPABASE_SERVICE_KEY || "", "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` },
                    });
                    if (piRes.ok) (await piRes.json()).forEach((p: any) => { pMap[p.id] = p.numero_processo; });
                }
                sigs.forEach((doc: any) => {
                    const sNames = (doc.signatarios || []).map((s: any) => s.name || s.nome).filter(Boolean).join(", ");
                    const pNum = pMap[doc.processo_id] || null;
                    alerts.push({ id: `assinatura-processo-${doc.id}`, type: "assinatura", title: doc.nome || "Documento", description: sNames ? `Signatários: ${sNames}${pNum ? ` (Processo)` : ""}` : `Aguardando assinatura${pNum ? ` (Processo)` : ""}`, date: doc.created_at, processoId: doc.processo_id, processoNumero: pNum });
                });
            }
        } catch (e) { console.log("[Alerts] Error proc sig:", e); }

        res.json({ alerts });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
