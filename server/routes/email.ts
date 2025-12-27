import { Router } from "express";
import * as resendService from "../services/resendService";

const router = Router();

router.post("/send", async (req, res) => {
    try {
        const result = await resendService.sendEmail(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/document-signature", async (req, res) => {
    try {
        const result = await resendService.sendDocumentSignatureRequest(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/document-signed", async (req, res) => {
    try {
        const result = await resendService.sendDocumentSignedNotification(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/deadline-reminder", async (req, res) => {
    try {
        const result = await resendService.sendDeadlineReminder(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/payment-reminder", async (req, res) => {
    try {
        const result = await resendService.sendPaymentReminder(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/user-invitation", async (req, res) => {
    try {
        const result = await resendService.sendUserInvitation(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/task-reminder", async (req, res) => {
    try {
        const result = await resendService.sendTaskReminder(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
