import { Router, type Request, type Response } from "express";
import multer from "multer";
import * as googleSystemAuthService from "../services/googleSystemAuthService";
import * as googleDriveService from "../services/googleDriveService";
import * as googleGmailService from "../services/googleGmailService";
import * as googleCalendarService from "../services/googleCalendarService";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// --- System Auth ---
router.get("/system/status", async (req: Request, res: Response) => {
    try {
        const status = await googleSystemAuthService.getConnectionStatus();
        console.log("[Google System] Status request result:", status);
        res.json(status);
    } catch (error: any) {
        console.error("[Google System] Status error:", error);
        res.json({ connected: false, error: error.message });
    }
});

router.get("/system/auth-url", async (req: Request, res: Response) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || req.hostname;
        const redirectUri = `${protocol}://${host}/api/google/system/callback`;
        const authUrl = googleSystemAuthService.getAuthUrl(redirectUri);
        res.json({ authUrl, redirectUri });
    } catch (error: any) {
        console.error("[Google System] Auth URL error:", error);
        res.status(500).json({ error: error.message || "Failed to generate auth URL" });
    }
});

router.get("/system/callback", async (req: Request, res: Response) => {
    try {
        const { code, error: authError } = req.query;
        if (authError) {
            console.error("[Google System] OAuth error:", authError);
            return res.redirect("/?google_error=" + encodeURIComponent(authError as string));
        }
        if (!code) return res.redirect("/?google_error=no_code");

        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || req.hostname;
        const redirectUri = `${protocol}://${host}/api/google/system/callback`;

        const tokens = await googleSystemAuthService.exchangeCodeForTokens(code as string, redirectUri);
        await googleSystemAuthService.connect(tokens.access_token, tokens.refresh_token, tokens.expiry_date, tokens.email);

        res.redirect("/?google_connected=true");
    } catch (error: any) {
        console.error("[Google System] Callback error:", error);
        res.redirect("/?google_error=" + encodeURIComponent(error.message || "connection_failed"));
    }
});

router.post("/system/disconnect", async (req: Request, res: Response) => {
    try {
        await googleSystemAuthService.disconnect();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Drive ---
router.get("/drive/status", async (_req, res) => {
    const connected = await googleDriveService.isConnected();
    console.log("[Google Drive] Status request result:", connected);
    res.json({ connected });
});

router.get("/drive/root-folder", async (_req, res) => {
    try {
        const folderId = await googleDriveService.getOrCreateRootFolder();
        res.json({ folderId, folderName: "FACILITA ADV" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/drive/process-folder/:numeroProcesso", async (req, res) => {
    try {
        const folderId = await googleDriveService.getOrCreateProcessFolder(req.params.numeroProcesso);
        res.json({ folderId, numeroProcesso: req.params.numeroProcesso });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/drive/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
        if (!req.file || !req.body.numeroProcesso) return res.status(400).json({ error: "File and numeroProcesso required" });
        const result = await googleDriveService.uploadFile(req.body.fileName || req.file.originalname, req.file.mimetype, req.file.buffer, req.body.numeroProcesso);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/drive/upload-from-url", async (req, res) => {
    try {
        const { fileUrl, fileName, numeroProcesso } = req.body;
        const result = await googleDriveService.uploadFromUrl(fileUrl, fileName, numeroProcesso);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/drive/folder/:folderId/files", async (req, res) => {
    try {
        const files = await googleDriveService.listFolderContents(req.params.folderId);
        res.json(files);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/drive/process-folders", async (_req, res) => {
    try {
        const folders = await googleDriveService.listProcessFolders();
        res.json(folders);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/drive/files/:fileId", async (req, res) => {
    try {
        await googleDriveService.deleteFile(req.params.fileId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Gmail ---
router.get("/gmail/status", async (_req, res) => {
    try {
        const connected = await googleGmailService.isConnected();
        if (connected) {
            const profile = await googleGmailService.getProfile();
            res.json({ connected: true, email: profile.email });
        } else res.json({ connected: false });
    } catch (error: any) {
        res.json({ connected: false, error: error.message });
    }
});

router.post("/gmail/send", async (req, res) => {
    try {
        const result = await googleGmailService.sendEmail(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/gmail/messages", async (req, res) => {
    try {
        const messages = await googleGmailService.listMessages(parseInt(req.query.maxResults as string) || 20, req.query.q as string);
        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/gmail/messages/:messageId", async (req, res) => {
    try {
        const message = await googleGmailService.getMessage(req.params.messageId);
        res.json(message);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Calendar ---
router.get("/calendar/status", async (_req, res) => {
    try {
        const connected = await googleCalendarService.isConnected();
        if (connected) {
            const info = await googleCalendarService.getCalendarInfo();
            res.json({ connected: true, ...info });
        } else res.json({ connected: false });
    } catch (error: any) {
        res.json({ connected: false, error: error.message });
    }
});

router.get("/calendar/events", async (req, res) => {
    try {
        const options = {
            timeMin: req.query.timeMin as string,
            timeMax: req.query.timeMax as string,
            maxResults: req.query.maxResults ? parseInt(req.query.maxResults as string) : 50,
            query: req.query.q as string,
        };
        const events = req.query.facilitaOnly === 'true'
            ? await googleCalendarService.listFacilitaEvents(options)
            : await googleCalendarService.listEvents(options);
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/calendar/events", async (req, res) => {
    try {
        const event = await googleCalendarService.createEvent(req.body);
        res.json(event);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.patch("/calendar/events/:eventId", async (req, res) => {
    try {
        const event = await googleCalendarService.updateEvent({ eventId: req.params.eventId, ...req.body });
        res.json(event);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/calendar/events/:eventId", async (req, res) => {
    try {
        await googleCalendarService.deleteEvent(req.params.eventId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
