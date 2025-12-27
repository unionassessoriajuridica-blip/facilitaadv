import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast.ts";

interface GoogleUserInfo {
  name: string;
  email: string;
  picture?: string;
  id: string;
}

interface GoogleAuthConfig {
  clientId: string;
  scopes: string[];
}

interface GoogleAuthReturn {
  isAuthenticated: boolean;
  userInfo: GoogleUserInfo | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  clientId: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: { access_token?: string }) => void;
            error_callback?: (error: any) => void;
          }) => { requestAccessToken: () => void };
          revoke: (token: string, callback?: () => void) => void;
        };
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const useGoogleAuth = (config: GoogleAuthConfig): GoogleAuthReturn => {
  const [state, setState] = useState({
    isAuthenticated: false,
    userInfo: null as GoogleUserInfo | null,
    isLoading: true,
    accessToken: localStorage.getItem("google_access_token"),
    gsiLoaded: false,
  });

  const verifyToken = useCallback(async (token: string) => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/tokeninfo",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  const { toast } = useToast();

  const fetchUserInfo = useCallback(
    async (token: string) => {
      try {
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          userInfo: {
            id: data.sub,
            name: data.name,
            email: data.email,
            picture: data.picture,
          },
        }));
      } catch (error) {
        console.error("Failed to fetch user info", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar informações do usuário",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const initializeGSI = useCallback(() => {
    if (!window.google || !window.google.accounts) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setState((prev) => ({ ...prev, gsiLoaded: true, isLoading: false }));
      };
      script.onerror = () => {
        setState((prev) => ({ ...prev, isLoading: false }));
        toast({
          title: "Erro",
          description: "Falha ao carregar Google Identity Services",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
    } else {
      setState((prev) => ({ ...prev, gsiLoaded: true, isLoading: false }));
    }
  }, [toast]);

  useEffect(() => {
    const initialize = async () => {
      // 1. Carrega a biblioteca GSI se necessário
      if (!window.google || !window.google.accounts) {
        initializeGSI();
      } else {
        setState((prev) => ({ ...prev, gsiLoaded: true }));
      }

      // 2. Verifica se há integração de sistema (Global)
      try {
        const sysResponse = await fetch('/api/google/system/status');
        const sysData = await sysResponse.json();
        if (sysData.connected) {
          setState((prev) => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
            userInfo: sysData.email ? {
              id: 'system',
              name: 'Sistema (Global)',
              email: sysData.email
            } : prev.userInfo
          }));
          return; // Conexão global tem prioridade
        }
      } catch (error) {
        console.error("Erro ao verificar status do sistema:", error);
      }

      // 3. Verifica se há um token armazenado (Local)
      const storedToken = localStorage.getItem("google_access_token");

      if (storedToken) {
        try {
          setState((prev) => ({ ...prev, isLoading: true }));

          // 4. Verifica se o token ainda é válido
          const tokenValid = await verifyToken(storedToken);

          if (tokenValid) {
            // 5. Atualiza o estado e busca informações do usuário
            setState((prev) => ({
              ...prev,
              accessToken: storedToken,
              isAuthenticated: true,
              gsiLoaded: true,
            }));

            await fetchUserInfo(storedToken);
          } else {
            // 6. Token inválido - limpa o storage
            localStorage.removeItem("google_access_token");
          }
        } catch (error) {
          console.error("Erro na verificação do token:", error);
          localStorage.removeItem("google_access_token");
        } finally {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initialize();

    return () => {
      // Limpeza opcional se necessário
    };
  }, [initializeGSI, fetchUserInfo, verifyToken]);

  const signIn = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      if (!state.gsiLoaded)
        throw new Error("Google Identity Services não carregado");

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: config.scopes.join(" "),
        callback: async (tokenResponse) => {
          if (tokenResponse.access_token) {
            localStorage.setItem(
              "google_access_token",
              tokenResponse.access_token
            );
            setState((prev) => ({
              ...prev,
              accessToken: tokenResponse.access_token ?? null,
              isAuthenticated: true,
            }));
            await fetchUserInfo(tokenResponse.access_token);
            toast({
              title: "Conectado",
              description: "Autenticação com Google realizada com sucesso",
            });
          }
        },
        error_callback: (error) => {
          toast({
            title: "Erro",
            description: error.message || "Falha na autenticação com Google",
            variant: "destructive",
          });
        },
      });

      client.requestAccessToken();
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao autenticar com Google",
        variant: "destructive",
      });
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [config.clientId, config.scopes, fetchUserInfo, state.gsiLoaded, toast]);

  const signOut = useCallback(async () => {
    try {
      if (state.accessToken) {
        window.google.accounts.oauth2.revoke(state.accessToken, () => {
          console.log("Token revogado");
        });
        localStorage.removeItem("google_access_token");
      }
      setState({
        isAuthenticated: false,
        userInfo: null,
        isLoading: false,
        accessToken: null,
        gsiLoaded: state.gsiLoaded,
      });
      toast({
        title: "Desconectado",
        description: "Conta Google desconectada com sucesso",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Erro",
        description: "Falha ao desconectar conta Google",
        variant: "destructive",
      });
    }
  }, [state.accessToken, state.gsiLoaded, toast]);

  return {
    isAuthenticated: state.isAuthenticated,
    userInfo: state.userInfo,
    isLoading: state.isLoading,
    signIn,
    signOut,
    getAccessToken: () => state.accessToken,
    setAccessToken: (token: string | null) =>
      setState((prev) => ({ ...prev, accessToken: token })),
    setIsAuthenticated: (value: boolean) =>
      setState((prev) => ({ ...prev, isAuthenticated: value })),
    clientId: config.clientId,
  };
};
