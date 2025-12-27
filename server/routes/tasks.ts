import { Router } from "express";

const router = Router();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

router.get("/", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Authorization header required" });

        const { process_id, status } = req.query;

        // Build query parameters
        let queryParams = ["select=*", "order=due_date.asc"];

        if (process_id) {
            queryParams.push(`process_id=eq.${process_id}`);
        }
        if (status) {
            queryParams.push(`status=eq.${status}`);
        }

        const queryString = queryParams.join("&");

        // Fetch all tasks from Supabase REST API
        const tasksResponse = await fetch(`${SUPABASE_URL}/rest/v1/tasks?${queryString}`, {
            headers: {
                "apikey": SUPABASE_ANON_KEY || "",
                "Authorization": authHeader,
                "Prefer": "return=representation"
            },
        });

        if (!tasksResponse.ok) {
            const error = await tasksResponse.text();
            console.error("[Tasks API] Error:", error);
            return res.status(tasksResponse.status).json({ error: "Failed to fetch tasks" });
        }

        const tasks = await tasksResponse.json();
        res.json(tasks);
    } catch (error: any) {
        console.error("[Tasks API] Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
