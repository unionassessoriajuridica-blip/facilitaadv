import * as React from "react";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import {
  QrCode,
  Power,
  RefreshCw,
  MessageCircle,
  RotateCcw,
  Send,
} from "lucide-react";
import { useBulkCobrancaMessages } from "@/hooks/useBulkCobrancaMessages.ts";

const WhatsAppManager = () => {
  const [status, setStatus] = useState<string>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { enviarCobrancasEmMassa, loading: loadingBulk } =
    useBulkCobrancaMessages();

  const apiUrl = import.meta.env.VITE_WHATSAPP_API_URL;
  const apiToken = import.meta.env.VITE_WHATSAPP_API_TOKEN;

  const checkStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/status`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.connected ? "connected" : "disconnected");
        if (data.connected) {
          setQrCode(null);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor WhatsApp",
      });
    }
  };

  const restartWhatsApp = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/restart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: "Reiniciando",
          description: "Serviço WhatsApp está sendo reiniciado...",
        });

        window.location.reload();

        // Aguardar um pouco e verificar status
        setTimeout(() => {
          checkStatus();
          getQRCode();
        }, 3000);
      }
    } catch (error) {
      console.error("Erro ao reiniciar:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reiniciar o serviço WhatsApp.",
      });
    } finally {
      setLoading(false);
    }
  };

  // função getQRCode:
  const getQRCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/qr-code`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      // Verificar se a resposta é JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Resposta do servidor não é JSON");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao obter QR code");
      }

      if (data.success && data.qrCode) {
        setQrCode(data.qrCode);
      } else if (data.status === "ALREADY_CONNECTED") {
        setStatus("connected");
        setQrCode(null);
        toast({
          title: "WhatsApp já conectado",
          description: "O WhatsApp já está conectado e pronto para uso.",
        });
      } else {
        toast({
          title: "Aguarde",
          description: data.message || "QR Code ainda não disponível.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao obter QR code:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          error.message || "Não foi possível conectar ao serviço WhatsApp.",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setStatus("disconnected");
        setQrCode(null);
        toast({
          title: "Desconectado",
          description: "WhatsApp desconectado com sucesso.",
        });
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível desconectar o WhatsApp.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Verificar status a cada 10 segundos
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-default h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="w-5 h-5" />
          WhatsApp Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === "connected"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status === "connected" ? "Conectado" : "Desconectado"}
          </span>
        </div>

        {qrCode && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Escaneie o QR code com o WhatsApp
            </p>
            <img
              src={qrCode}
              alt="QR Code WhatsApp"
              className="mx-auto border rounded"
              style={{ width: 200, height: 200 }}
            />
          </div>
        )}

        <div className="flex gap-2">
          {status === "disconnected" ? (
            <Button
              onClick={getQRCode}
              disabled={loading}
              className="flex-1"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4 mr-2" />
              )}
              Conectar WhatsApp
            </Button>
          ) : (
            <Button
              onClick={disconnectWhatsApp}
              disabled={loading}
              variant="destructive"
              className="flex-1"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Power className="w-4 h-4 mr-2" />
              )}
              Desconectar
            </Button>
          )}
          <Button
            onClick={enviarCobrancasEmMassa}
            disabled={loadingBulk || status !== "connected"}
            variant="default"
            className="flex-1"
            size="sm"
          >
            {loadingBulk ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Todas Cobranças
          </Button>

          <Button
            onClick={checkStatus}
            variant="outline"
            disabled={loading}
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={restartWhatsApp}
            variant="outline"
            disabled={loading}
            size="sm"
            className="min-w-[40px]"
            title="Reiniciar serviço WhatsApp"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppManager;
