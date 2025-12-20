import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { useGoogleAuth } from "@/hooks/useGoogleAuth.ts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const GoogleCallback = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("Processando autenticacao...");
  const googleAuth = useGoogleAuth({
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar",
    ],
  });

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const error = params.get("error");

        if (error) {
          throw new Error(error);
        }

        if (!code) {
          throw new Error("Codigo de autorizacao nao encontrado");
        }

        setStatus("Trocando codigo por tokens...");

        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            code,
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
            redirect_uri: `${window.location.origin}/google-integration/callback`,
            grant_type: "authorization_code",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error_description || data.error || "Falha na autenticacao");
        }

        const accessToken = data.access_token;
        const refreshToken = data.refresh_token;
        const expiresIn = data.expires_in || 3600;

        setStatus("Salvando tokens no localStorage...");
        localStorage.setItem("google_access_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("google_refresh_token", refreshToken);
        }
        googleAuth.setAccessToken(accessToken);
        googleAuth.setIsAuthenticated(true);

        setStatus("Salvando integracao no banco de dados...");
        
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        const supabaseToken = sessionData?.session?.access_token;

        if (userId && supabaseToken) {
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const upsertResponse = await fetch(
            `${supabaseUrl}/rest/v1/google_integration?on_conflict=user_id`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseToken}`,
                "Prefer": "resolution=merge-duplicates",
              },
              body: JSON.stringify({
                user_id: userId,
                access_token: accessToken,
                refresh_token: refreshToken || "",
                calendar_id: "primary",
                expires_at: expiresAt.toISOString(),
              }),
            }
          );

          if (!upsertResponse.ok) {
            const errorText = await upsertResponse.text();
            console.error("Erro ao salvar integracao:", errorText);
            toast({
              title: "Aviso",
              description: "Conectado, mas houve um problema ao salvar a integracao. Alguns recursos podem nao funcionar.",
              variant: "destructive",
            });
          } else {
            console.log("Integracao salva com sucesso na tabela google_integration");
          }
        }

        toast({
          title: "Conectado com sucesso!",
          description: "Sua conta Google foi conectada.",
        });

        navigate("/calendar");
      } catch (err: any) {
        console.error("Erro no callback:", err);
        toast({
          title: "Erro na autenticacao",
          description: err.message || "Erro desconhecido",
          variant: "destructive",
        });
        navigate("/google-integration?error=true");
      }
    };

    handleCallback();
  }, [location, navigate, toast, googleAuth]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="w-12 h-12 animate-spin" />
        <h1 className="text-2xl font-bold">{status}</h1>
        <p className="text-muted-foreground">
          Por favor, aguarde enquanto conectamos sua conta Google.
        </p>
      </div>
    </div>
  );
};
