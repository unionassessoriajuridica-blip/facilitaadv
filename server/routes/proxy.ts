import { Router, type Request, type Response } from "express";

const router = Router();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

router.all("/functions/:functionName", async (req: Request, res: Response) => {
    try {
        const { functionName } = req.params;
        const authHeader = req.headers.authorization;

        if (!authHeader) return res.status(401).json({ error: "Authorization header required" });
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(500).json({ error: "Supabase configuration missing" });

        let url = `${SUPABASE_URL}/functions/v1/${functionName}`;
        const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
        if (queryString) url += `?${queryString}`;

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

export default router;
