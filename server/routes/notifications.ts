import { Router } from "express";
import * as resendService from "../services/resendService";
import { requireAuth } from "../middleware/auth";

const router = Router();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

router.use(requireAuth);

router.post("/send-deadline-reminders", async (req, res) => {
    try {
        const { daysAhead = 3, notifyEmail } = req.body;
        if (!notifyEmail) return res.status(400).json({ error: "notifyEmail is required" });
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/processos?prazo=gte.${today.toISOString().split('T')[0]}&prazo=lte.${futureDate.toISOString().split('T')[0]}&status=eq.ATIVO&select=id,numero_processo,prazo,observacoes,clientes(nome,email)`, {
            headers: { "apikey": SUPABASE_ANON_KEY || "", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
        });

        if (!response.ok) throw new Error("Failed to fetch processes");
        const processes = await response.json();
        const emailsSent: string[] = [];
        for (const processo of processes) {
            const prazoDate = new Date(processo.prazo);
            const daysRemaining = Math.ceil((prazoDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            try {
                await resendService.sendDeadlineReminder({ to: notifyEmail, processNumber: processo.numero_processo || "Sem número", clientName: processo.clientes?.nome || "Cliente", deadline: prazoDate.toLocaleDateString("pt-BR"), description: processo.observacoes || "Prazo processual", daysRemaining });
                emailsSent.push(processo.numero_processo);
            } catch (err) { }
        }
        res.json({ success: true, processesFound: processes.length, emailsSent: emailsSent.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/send-payment-reminders", async (req, res) => {
    try {
        const { daysAhead = 3 } = req.body;
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/financeiro?data_vencimento=gte.${today.toISOString().split('T')[0]}&data_vencimento=lte.${futureDate.toISOString().split('T')[0]}&status=eq.pendente&tipo=eq.recebimento&select=*,clientes(nome,email)`, {
            headers: { "apikey": SUPABASE_ANON_KEY || "", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
        });

        if (!response.ok) throw new Error("Failed to fetch payments");
        const payments = await response.json();
        const emailsSent: string[] = [];
        for (const payment of payments) {
            if (!payment.clientes?.email) continue;
            try {
                await resendService.sendPaymentReminder({ to: payment.clientes.email, clientName: payment.clientes.nome || "Cliente", amount: `R$ ${parseFloat(payment.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, dueDate: new Date(payment.data_vencimento).toLocaleDateString("pt-BR"), description: payment.descricao || "Honorários" });
                emailsSent.push(payment.clientes.email);
            } catch (err) { }
        }
        res.json({ success: true, paymentsFound: payments.length, emailsSent: emailsSent.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/send-task-reminders", async (req, res) => {
    try {
        const { daysAhead = 3, notifyEmail } = req.body;
        if (!notifyEmail) return res.status(400).json({ error: "notifyEmail is required" });
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/tasks?status=eq.pending&due_date=gte.${today.toISOString().split('T')[0]}&due_date=lte.${futureDate.toISOString().split('T')[0]}&select=*,processos(numero_processo,clientes(nome))`, {
            headers: { "apikey": SUPABASE_ANON_KEY || "", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
        });

        if (!response.ok) throw new Error("Failed to fetch tasks");
        const tasks = await response.json();
        const emailsSent: string[] = [];
        for (const task of tasks) {
            const dueDate = new Date(task.due_date);
            const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            try {
                await resendService.sendTaskReminder({ to: notifyEmail, taskTitle: task.title || "Tarefa", processNumber: task.processos?.numero_processo || "Sem processo", clientName: task.processos?.clientes?.nome || "Cliente", dueDate: dueDate.toLocaleDateString("pt-BR"), daysRemaining });
                emailsSent.push(task.title);
            } catch (err) { }
        }
        res.json({ success: true, tasksFound: tasks.length, emailsSent: emailsSent.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/send-all-reminders", async (req, res) => {
    try {
        const { daysAhead = 3, notifyEmail } = req.body;
        if (!notifyEmail) return res.status(400).json({ error: "notifyEmail is required" });

        const results = { deadlines: 0, payments: 0, tasks: 0 };
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + daysAhead);

        // 1. Deadlines
        try {
            const res1 = await fetch(`${SUPABASE_URL}/rest/v1/processos?prazo=gte.${today.toISOString().split('T')[0]}&prazo=lte.${futureDate.toISOString().split('T')[0]}&status=eq.ATIVO&select=id,numero_processo,prazo,observacoes,clientes(nome)`, {
                headers: { "apikey": SUPABASE_ANON_KEY || "", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
            });
            if (res1.ok) {
                for (const p of (await res1.json())) {
                    const pDate = new Date(p.prazo);
                    await resendService.sendDeadlineReminder({ to: notifyEmail, processNumber: p.numero_processo || "Sem número", clientName: p.clientes?.nome || "Cliente", deadline: pDate.toLocaleDateString("pt-BR"), description: p.observacoes || "Prazo", daysRemaining: Math.ceil((pDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) });
                    results.deadlines++;
                }
            }
        } catch (e) { }

        // 2. Payments
        try {
            const res2 = await fetch(`${SUPABASE_URL}/rest/v1/financeiro?data_vencimento=gte.${today.toISOString().split('T')[0]}&data_vencimento=lte.${futureDate.toISOString().split('T')[0]}&status=eq.pendente&tipo=eq.recebimento&select=*,clientes(nome,email)`, {
                headers: { "apikey": SUPABASE_ANON_KEY || "", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
            });
            if (res2.ok) {
                for (const p of (await res2.json())) {
                    if (!p.clientes?.email) continue;
                    await resendService.sendPaymentReminder({ to: p.clientes.email, clientName: p.clientes.nome || "Cliente", amount: `R$ ${parseFloat(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, dueDate: new Date(p.data_vencimento).toLocaleDateString("pt-BR"), description: p.descricao || "Honorários" });
                    results.payments++;
                }
            }
        } catch (e) { }

        // 3. Tasks
        try {
            const res3 = await fetch(`${SUPABASE_URL}/rest/v1/tasks?status=eq.pending&due_date=gte.${today.toISOString().split('T')[0]}&due_date=lte.${futureDate.toISOString().split('T')[0]}&select=*,processos(numero_processo,clientes(nome))`, {
                headers: { "apikey": SUPABASE_ANON_KEY || "", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
            });
            if (res3.ok) {
                for (const t of (await res3.json())) {
                    const dDate = new Date(t.due_date);
                    await resendService.sendTaskReminder({ to: notifyEmail, taskTitle: t.title || "Tarefa", processNumber: t.processos?.numero_processo || "Sem processo", clientName: t.processos?.clientes?.nome || "Cliente", dueDate: dDate.toLocaleDateString("pt-BR"), daysRemaining: Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) });
                    results.tasks++;
                }
            }
        } catch (e) { }

        res.json({ success: true, summary: results, totalSent: results.deadlines + results.payments + results.tasks });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
