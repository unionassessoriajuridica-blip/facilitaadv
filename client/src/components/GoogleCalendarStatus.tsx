import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, Settings } from "lucide-react";
import { googleCalendarSecure } from "@/services/googleCalendarSecureService";

interface Props {
  compact?: boolean;
  showConfigButton?: boolean;
}

export const GoogleCalendarStatus = ({ compact = false, showConfigButton = true }: Props) => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await googleCalendarSecure.getStatus();
        setIsConnected(status.is_connected);
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isLoading ? (
            "Verificando..."
          ) : isConnected ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Sincronizado
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Desconectado
            </>
          )}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isConnected 
                ? "bg-green-100 dark:bg-green-900/30" 
                : "bg-muted"
            }`}>
              <Calendar className={`w-5 h-5 ${
                isConnected 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-muted-foreground"
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Google Calendar</span>
                <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                  {isLoading ? (
                    "..."
                  ) : isConnected ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Inativo
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isConnected
                  ? "Eventos sincronizados automaticamente"
                  : "Configure para sincronizar eventos"}
              </p>
            </div>
          </div>
          {showConfigButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/google-calendar-config")}
              data-testid="button-google-calendar-config"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
