import * as React from "react";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Mail,
  Calendar,
  Shield,
  Check,
  AlertCircle,
  ExternalLink,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

interface GoogleIntegrationCardProps {
  onConnect?: (permissions: string[]) => void;
  onDisconnect?: () => void;
  isConnected?: boolean;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
}
declare const google: any;
export const GoogleIntegrationCard: React.FC<GoogleIntegrationCardProps> = ({
  onConnect,
  onDisconnect,
  isConnected = false,
  userInfo,
}) => {
  const { toast } = useToast();
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      console.log(
        "GoogleIntegrationCard VITE_GOOGLE_CLIENT_ID:",
        import.meta.env.VITE_GOOGLE_CLIENT_ID
      );
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar",
  ].join(" ");

  useEffect(() => {
    let script: HTMLScriptElement | null = null;
    let timeoutId: NodeJS.Timeout;
    let auth2LoadTimeout: NodeJS.Timeout;

    if (typeof window === "undefined" || gapiLoaded) return;

    const loadGapi = async () => {
      try {
        // 1. Carrega o script principal
        if (!window.gapi) {
          script = document.createElement("script");
          script.src = "https://apis.google.com/js/api.js";
          script.async = true;
          script.defer = true;

          await new Promise<void>((resolve, reject) => {
            script!.onload = () => resolve();
            script!.onerror = () =>
              reject(new Error("Falha ao carregar Google API"));
            document.body.appendChild(script!);

            // Timeout para o script
            timeoutId = setTimeout(() => {
              reject(new Error("Timeout ao carregar Google API"));
            }, 10000);
          });
        }

        // 2. Carrega o módulo auth2
        if (!window.gapi.auth2) {
          await new Promise<void>((resolve, reject) => {
            auth2LoadTimeout = setTimeout(() => {
              reject(new Error("Timeout ao carregar módulo auth2"));
            }, 10000);

            window.gapi.load("auth2:client", {
              callback: () => {
                clearTimeout(auth2LoadTimeout);
                resolve();
              },
              onerror: () => {
                clearTimeout(auth2LoadTimeout);
                reject(new Error("Falha ao carregar módulo auth2"));
              },
            });
          });
        }

        setGapiLoaded(true);
      } catch (error) {
        console.error("Erro no carregamento:", error);
        toast({
          title: "Erro de conexão",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    };

    loadGapi();

    return () => {
      if (script && document.body.contains(script)) {
        document.body.removeChild(script);
      }
      clearTimeout(timeoutId);
      clearTimeout(auth2LoadTimeout);

      if (window.gapi?.auth2?.getAuthInstance()) {
        window.gapi.auth2.getAuthInstance().disconnect();
      }
    };
  }, [gapiLoaded, scopes, toast]);

  const googleAuth = useGoogleAuth({
    clientId,
    scopes: scopes.split(" "),
  });

  const permissions = [
    {
      icon: User,
      title: "Informações básicas do perfil",
      description: "Nome, foto e endereço de e-mail",
      required: true,
    },
    {
      icon: Mail,
      title: "Gmail",
      description: "Enviar e-mails em seu nome através do sistema",
      required: true,
    },
    {
      icon: Calendar,
      title: "Google Calendar",
      description: "Visualizar e gerenciar sua agenda",
      required: false,
    },
  ];

  const navigate = useNavigate();

  const handleConnect = () => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id:googleAuth.clientId,
      scope:
        "email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar",
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          onConnect?.(["gmail", "calendar"]);

          // Adiciona o feedback visual e redirecionamento
          await Swal.fire({
            title: "Conectado com sucesso!",
            text: "Sua conta Google foi integrada ao sistema.",
            icon: "success",
            confirmButtonText: "Ir para o Calendário",
            showCancelButton: true,
            cancelButtonText: "Ficar aqui",
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/calendar");
            }
          });
        }
      },
      error_callback: (error) => {
        toast({
          title: "Erro",
          description: error.message || "Falha ao conectar",
          variant: "destructive",
        });
      },
    });
    client.requestAccessToken();
  };
  const handleDisconnect = async () => {
    try {
      await googleAuth.signOut();
      onDisconnect?.();
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      toast({
        title: "Erro ao desconectar",
        description: "Falha ao desconectar a conta Google",
        variant: "destructive",
      });
    }
  };
  // Usar dados reais do Google Auth quando disponível
  const currentUserInfo = googleAuth.userInfo || userInfo;
  const isReallyConnected = googleAuth.isAuthenticated || isConnected;

  if (isReallyConnected && currentUserInfo) {
    return (
      <Card className="w-full max-w-md mx-auto border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={
                  (currentUserInfo as any).picture ||
                  (currentUserInfo as any).avatar
                }
                alt={currentUserInfo.name}
              />
              <AvatarFallback className="bg-google text-white">
                {currentUserInfo.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg text-green-800">
                Conectado ao Google
              </CardTitle>
              <p className="text-sm text-green-600">{currentUserInfo.email}</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Ativo
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-green-800">Serviços conectados:</h4>
            <div className="grid gap-2">
              {permissions.map((permission, index) => {
                const IconComponent = permission.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-white rounded-lg border border-green-200"
                  >
                    <IconComponent className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        {permission.title}
                      </p>
                      <p className="text-xs text-green-600">
                        {permission.description}
                      </p>
                    </div>
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleDisconnect}
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            Desconectar conta Google
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-google rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Conectar com Google</CardTitle>
            <p className="text-sm text-muted-foreground">
              Integre seu Gmail e Google Calendar
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Segurança e Privacidade
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Suas informações são protegidas e usadas apenas para as
              funcionalidades solicitadas.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">O aplicativo poderá:</h4>

          {permissions.map((permission, index) => {
            const IconComponent = permission.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <IconComponent className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{permission.title}</p>
                    {permission.required && (
                      <Badge variant="secondary" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {permission.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 space-y-3">
          <Button
            onClick={handleConnect}
            disabled={!gapiLoaded || isInitializing}
            className="w-full bg-google hover:bg-google/90"
          >
            {isInitializing ? (
              "Inicializando..."
            ) : !gapiLoaded ? (
              "Preparando conexão..."
            ) : googleAuth.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Conectando...
              </div>
            ) : (
              <>
                Continuar com Google
                <ExternalLink className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            <span>Você pode revogar essas permissões a qualquer momento</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
