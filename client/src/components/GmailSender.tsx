import * as React from "react";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Paperclip, X, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGmail } from "@/hooks/useGmail";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GmailSenderProps {
  recipientEmail?: string;
  subject?: string;
  body?: string;
  onEmailSent?: () => void;
}

export const GmailSender: React.FC<GmailSenderProps> = ({
  recipientEmail = "",
  subject = "",
  body = "",
  onEmailSent,
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    to: recipientEmail,
    cc: "",
    bcc: "",
    subject: subject,
    body: body,
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const clientId = "90141190775-qqgb05aq59fmqegieiguk4gq0u0140sp.apps.googleusercontent.com";

  // Configuração real do Google OAuth
  const googleAuth = useGoogleAuth({
    clientId,
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.send",
    ],
  });

  console.log("Google Client ID GmailSender:", clientId);

  const gmail = useGmail(googleAuth.getAccessToken());

  const handleSendEmail = async () => {
    if (!emailData.to || !emailData.subject) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o destinatário e o assunto.",
        variant: "destructive",
      });
      return;
    }

    const emailPayload = {
      to: emailData.to.split(",").map((email) => email.trim()),
      cc: emailData.cc
        ? emailData.cc.split(",").map((email) => email.trim())
        : undefined,
      bcc: emailData.bcc
        ? emailData.bcc.split(",").map((email) => email.trim())
        : undefined,
      subject: emailData.subject,
      body: emailData.body,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const success = await gmail.sendEmail(emailPayload);

    if (success) {
      setIsOpen(false);
      setEmailData({
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        body: "",
      });
      setAttachments([]);
      onEmailSent?.();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  if (!googleAuth.isAuthenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Enviar Email</CardTitle>
              <p className="text-sm text-muted-foreground">Via Gmail</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Conecte sua conta Google
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Para enviar emails, você precisa primeiro conectar sua conta
                Google.
              </p>
            </div>
          </div>

          <Button
            onClick={googleAuth.signIn}
            disabled={googleAuth.isLoading}
            className="w-full"
          >
            <Mail className="w-4 h-4 mr-2" />
            {googleAuth.isLoading ? "Conectando..." : "Conectar Gmail"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Mail className="w-4 h-4 mr-2" />
          Enviar Email
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Enviar Email via Gmail
          </DialogTitle>
          <DialogDescription>
            Conectado como: {googleAuth.userInfo?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="to">Para *</Label>
            <Input
              id="to"
              value={emailData.to}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, to: e.target.value }))
              }
              placeholder="cliente@email.com, outro@email.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cc">CC</Label>
              <Input
                id="cc"
                value={emailData.cc}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, cc: e.target.value }))
                }
                placeholder="cc@email.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bcc">CCO</Label>
              <Input
                id="bcc"
                value={emailData.bcc}
                onChange={(e) =>
                  setEmailData((prev) => ({ ...prev, bcc: e.target.value }))
                }
                placeholder="bcc@email.com"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Assunto do email"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Mensagem</Label>
            <Textarea
              id="body"
              value={emailData.body}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, body: e.target.value }))
              }
              placeholder="Digite sua mensagem aqui..."
              rows={8}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attachments">Anexos</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("attachments")?.click()}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Adicionar Arquivo
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm truncate">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSendEmail} disabled={gmail.loading}>
            {gmail.loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </div>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
