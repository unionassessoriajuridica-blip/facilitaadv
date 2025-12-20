import * as React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";

interface WhatsAppStats {
  status: "connected" | "disconnected" | "error";
  mensagensPendentes: number;
  mensagensEnviadas: number;
  sessoes: number;
  loading: boolean;
}

export const useWhatsAppStats = () => {
  const [stats, setStats] = useState<WhatsAppStats>({
    status: "disconnected",
    mensagensPendentes: 0,
    mensagensEnviadas: 0,
    sessoes: 0,
    loading: true,
  });

  const apiUrl = import.meta.env.VITE_WHATSAPP_API_URL;
  const apiToken = import.meta.env.VITE_WHATSAPP_API_TOKEN;
  
  console.log("Variáveis de ambiente:", {
    apiUrl: import.meta.env.VITE_WHATSAPP_API_URL,
    apiToken: import.meta.env.VITE_WHATSAPP_API_TOKEN,
  });

  const fetchStats = async () => {
    try {
      // 🔹 Buscar status da API do WhatsApp
      const statusResponse = await fetch(`${apiUrl}/status`, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      let status: "connected" | "disconnected" | "error" = "error";
      let sessoes = 0;

      if (statusResponse.ok) {
        const data = await statusResponse.json();
        status = data.connected ? "connected" : "disconnected";
        sessoes = data.connected ? 1 : 0;
      }

      // 🔹 Mensagens Pendentes
      const { count: pendentesCount, error: pendentesError } = await supabase
        .from("financeiro")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDENTE")
        .is("ultimo_envio_cobranca", null);

      if (pendentesError) throw pendentesError;

      // 🔹 Mensagens Enviadas
      const { count: enviadasCount, error: enviadasError } = await supabase
        .from("financeiro")
        .select("*", { count: "exact", head: true })
        .not("ultimo_envio_cobranca", "is", null);

      if (enviadasError) throw enviadasError;

      setStats({
        status,
        mensagensPendentes: pendentesCount || 0,
        mensagensEnviadas: enviadasCount || 0,
        sessoes,
        loading: false,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas do WhatsApp:", error);
      setStats((prev) => ({ ...prev, status: "error", loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return stats;
};
