import * as React from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft, MessageCircle, Wifi, Send, Power, CheckCircle } from "lucide-react";
import WhatsAppManager from "@/components/WhatsAppManager.tsx";
import { useWhatsAppStats } from "@/hooks/useWhatsAppStats.ts";

const WhatsAppManagement = () => {
  const navigate = useNavigate();
  const { status, mensagensPendentes, mensagensEnviadas, sessoes, loading } = useWhatsAppStats();

  const stats = [
    {
      title: "Status Conexão",
      value:
        status === "connected"
          ? "Conectado"
          : status === "disconnected"
          ? "Desconectado"
          : "Erro",
      icon: Wifi,
      color:
        status === "connected"
          ? "text-green-600"
          : status === "disconnected"
          ? "text-red-600"
          : "text-gray-600",
    },
    {
      title: "Mensagens Pendentes",
      value: loading ? "..." : mensagensPendentes.toString(),
      icon: Send,
      color: "text-blue-600",
    },
    {
      title: "Mensagens Enviadas",
      value: loading ? "..." : mensagensEnviadas.toString(),
      icon: CheckCircle,
      color: "text-emerald-600",
    },
    {
      title: "Sessões",
      value: loading ? "..." : sessoes.toString(),
      icon: Power,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold">WhatsApp Manager</h1>
              <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                WHATSAPP
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* WhatsApp Manager Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento do WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <WhatsAppManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppManagement;
