import type { Request, Response, NextFunction } from "express";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
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
