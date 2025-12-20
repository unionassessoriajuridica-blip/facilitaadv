import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { googleCalendarSecure } from "@/services/googleCalendarSecureService";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
  Users,
  Clock,
  Settings,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

const GoogleCalendarConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [integrationInfo, setIntegrationInfo] = useState<{
    calendar_name?: string;
    connected_at?: string;
    connected_by_email?: string;
  } | null>(null);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    setIsLoading(true);
    try {
      const status = await googleCalendarSecure.getStatus();
      setIsConnected(status.is_connected);

      if (status.is_connected) {
        setIntegrationInfo({
          calendar_name: status.calendar_name || "Calendário Principal",
          connected_at: undefined,
          connected_by_email: undefined,
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/google-calendar-callback`;

    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    const result = await Swal.fire({
      title: "Desconectar Google Calendar?",
      text: "Todos os usuários perderão acesso à integração com o calendário.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, desconectar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });

    if (result.isConfirmed) {
      const success = await googleCalendarSecure.disconnect();
      if (success) {
        setIsConnected(false);
        setIntegrationInfo(null);
        toast({
          title: "Desconectado",
          description: "A integração com o Google Calendar foi removida.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível desconectar a integração.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p>Verificando configuração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Configuração do Google Calendar</h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle>Google Calendar</CardTitle>
                      <CardDescription>
                        Integração centralizada para toda a equipe
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Desconectado
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected && integrationInfo ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Calendário:</span>
                        <span className="font-medium">{integrationInfo.calendar_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Conectado por:</span>
                        <span className="font-medium">{integrationInfo.connected_by_email}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">
                          {integrationInfo.connected_at
                            ? new Date(integrationInfo.connected_at).toLocaleDateString("pt-BR")
                            : "-"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={checkIntegrationStatus}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Verificar Status
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleDisconnect}
                      >
                        Desconectar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure a integração com o Google Calendar para que todos os
                      usuários possam sincronizar eventos automaticamente.
                    </p>

                    <Button
                      className="w-full"
                      onClick={handleConnect}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 mr-2" />
                          Conectar com Google
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funciona</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                      1
                    </span>
                    <span>
                      Um administrador conecta a conta Google do escritório
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                      2
                    </span>
                    <span>
                      Todos os eventos criados terão o prefixo{" "}
                      <Badge variant="outline" className="text-xs">[FACILITA ADV]</Badge>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                      3
                    </span>
                    <span>
                      Audiências e prazos são sincronizados automaticamente
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                      4
                    </span>
                    <span>
                      Toda a equipe visualiza os eventos no sistema
                    </span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benefícios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Acesso para toda equipe</h4>
                    <p className="text-sm text-muted-foreground">
                      Uma única configuração para todos os usuários
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Sincronização automática</h4>
                    <p className="text-sm text-muted-foreground">
                      Prazos e audiências são adicionados automaticamente
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Segurança OAuth 2.0</h4>
                    <p className="text-sm text-muted-foreground">
                      Autenticação segura com renovação automática de tokens
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formato dos eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Audiências</p>
                    <p className="font-mono text-sm">
                      [FACILITA ADV] Audiência - Processo #12345
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Prazos</p>
                    <p className="font-mono text-sm">
                      [FACILITA ADV] Prazo - Contestação
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Reuniões</p>
                    <p className="font-mono text-sm">
                      [FACILITA ADV] Reunião - Cliente João Silva
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarConfig;
