import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { googleCalendarSecure } from "@/services/googleCalendarSecureService";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const GoogleCalendarCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        setStatus("error");
        setErrorMessage("Acesso negado pelo usuário.");
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("Código de autorização não encontrado.");
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/google-calendar-callback`;

        const result = await googleCalendarSecure.exchangeCodeForTokens(code, redirectUri);

        if (result.success) {
          setStatus("success");
          setTimeout(() => {
            navigate("/google-calendar-config?success=true");
          }, 2000);
        } else {
          throw new Error(result.error || "Falha ao salvar integração");
        }
      } catch (error) {
        console.error("Erro no callback:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Erro desconhecido"
        );
      }
    };

    processCallback();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Configurando integração...</h2>
            <p className="text-muted-foreground">
              Estamos conectando sua conta do Google Calendar.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Conexão estabelecida!</h2>
            <p className="text-muted-foreground mb-4">
              O Google Calendar foi configurado com sucesso para toda a equipe.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Erro na conexão</h2>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/google-calendar-config")}
              >
                Voltar
              </Button>
              <Button onClick={() => navigate("/google-calendar-config")}>
                Tentar novamente
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;
