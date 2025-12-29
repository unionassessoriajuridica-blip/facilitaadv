import { Router } from "express";

const router = Router();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Global access

// GET /api/tasks - Listar tarefas
router.get("/", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

        const { process_id, status } = req.query;

        let queryParams = ["select=*", "order=due_date.asc"];
        if (process_id) queryParams.push(`process_id=eq.${process_id}`);
        if (status) queryParams.push(`status=eq.${status}`);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/tasks?${queryParams.join("&")}`, {
            headers: {
                "apikey": SUPABASE_SERVICE_KEY || "",
                "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}` // Bypass RLS for global access
            },
        });

        if (!response.ok) {
            const error = await response.text();
            return res.status(response.status).json({ error: error || "Failed to fetch tasks" });
        }

        const data = await response.json();
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/tasks - Criar tarefa
router.post("/", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

        const response = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, {
            method: "POST",
            headers: {
                "apikey": SUPABASE_SERVICE_KEY || "",
                "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const error = await response.text();
            return res.status(response.status).json({ error: error || "Failed to create task" });
        }

        const data = await response.json();
        res.status(201).json(data[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/tasks - Atualizar tarefa
router.patch("/", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "Task ID required" });

        const response = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`, {
            method: "PATCH",
            headers: {
                "apikey": SUPABASE_SERVICE_KEY || "",
                "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const error = await response.text();
            return res.status(response.status).json({ error: error || "Failed to update task" });
        }

        const data = await response.json();
        res.json(data[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/tasks - Deletar tarefa
router.delete("/", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "Task ID required" });

        const response = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`, {
            method: "DELETE",
            headers: {
                "apikey": SUPABASE_SERVICE_KEY || "",
                "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        });

        if (!response.ok) {
            const error = await response.text();
            return res.status(response.status).json({ error: error || "Failed to delete task" });
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
