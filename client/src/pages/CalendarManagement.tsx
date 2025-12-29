import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { ArrowLeft, Calendar, Clock, Plus, Loader2 } from "lucide-react";
import { GoogleCalendarCard } from "@/components/GoogleCalendarCard.tsx";
import { useGoogleAuth } from "@/hooks/useGoogleAuth.ts";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar.ts";
import Swal from "sweetalert2";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

declare const google: {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (tokenResponse: { access_token?: string }) => void;
        error_callback?: (error: any) => void;
      }) => {
        requestAccessToken: () => void;
      };
    };
  };
};

const CalendarManagement = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    hearings: 0,
    meetings: 0,
    deadlines: 0,
    others: 0,
  });

  // Configuração do Google OAuth
  const { isAuthenticated: isAuth, ...googleAuth } = useGoogleAuth({
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar",
    ],
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialEventType, setInitialEventType] = useState<
    "audiencia" | "reuniao" | "prazo" | "outros" | null
  >(null);

  const { loadEvents, events: calendarEvents, ...googleCalendar } = useGoogleCalendar();

  // Função para atualizar estatísticas
  const updateStatistics = useCallback((events: any[]) => {
    const newStats = {
      hearings: 0,
      meetings: 0,
      deadlines: 0,
      others: 0,
    };

    events.forEach((event) => {
      if (event.type) {
        switch (event.type) {
          case "audiencia":
            newStats.hearings++;
            break;
          case "reuniao":
            newStats.meetings++;
            break;
          case "prazo":
            newStats.deadlines++;
            break;
          default:
            newStats.others++;
            break;
        }
      } else {
        newStats.others++;
      }
    });

    setStats(newStats);
  }, []);

  // Função para carregar dados
  const loadCalendarData = useCallback(async () => {
    if (!isAuth) return;

    setIsLoading(true);
    try {
      const events = await loadEvents();
      updateStatistics(events);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      Swal.fire({
        title: "Erro",
        text: "Não foi possível carregar os eventos do Google Calendar",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuth, loadEvents, updateStatistics]);

  // Sincroniza quando autenticação ou diálogo mudar
  useEffect(() => {
    if (isAuth) {
      loadCalendarData();
    }
  }, [isAuth, loadCalendarData]);

  // Adicione este useEffect para resetar o initialEventType quando o diálogo fechar
  useEffect(() => {
    if (!dialogOpen) {
      setInitialEventType(null);
    }
  }, [dialogOpen]);

  // Gerencia o tipo inicial
  useEffect(() => {
    if (dialogOpen && initialEventType) {
      const timer = setTimeout(() => {
        setInitialEventType(initialEventType);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, initialEventType]);

  // Manipuladores de conexão
  const handleConnectGoogle = () => {
    navigate('/google-integration');
  };

  const handleDisconnectGoogle = () => {
    navigate('/google-integration');
  };

  // Formata os próximos eventos para exibição
  const getUpcomingEvents = () => {
    return calendarEvents.slice(0, 3).map((event) => ({
      id: event.id,
      title: event.title,
      date: format(event.start, "dd/MM/yyyy", { locale: ptBR }),
      time: format(event.start, "HH:mm", { locale: ptBR }),
      type: event.type,
      location: event.location || "Online",
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Gestão de Agenda</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Google Calendar Integration */}
            <div className="lg:col-span-2">
              <GoogleCalendarCard
                isConnected={isAuth}
                onConnect={handleConnectGoogle}
                onDisconnect={handleDisconnectGoogle}
                googleAuth={{ isAuthenticated: isAuth, ...googleAuth }}
                googleCalendar={{ loadEvents, events: calendarEvents, ...googleCalendar }}
                dialogOpen={dialogOpen}
                onDialogOpenChange={setDialogOpen}
                initialType={initialEventType}
              />
            </div>

            {/* Quick Actions & Summary */}
            <div className="space-y-6">
              {/* Quick Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Resumo da Semana
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Na seção de estatísticas, substitua por: */}
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.hearings}
                      </div>
                      <div className="text-xs text-blue-600">Audiências</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.meetings}
                      </div>
                      <div className="text-xs text-green-600">Reuniões</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.deadlines}
                      </div>
                      <div className="text-xs text-orange-600">Prazos</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.others}
                      </div>
                      <div className="text-xs text-purple-600">Outros</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Próximos Eventos</h4>
                    <div className="space-y-2">
                      {getUpcomingEvents().map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                        >
                          <div className="text-xs text-center min-w-[45px]">
                            <div className="font-medium">
                              {event.date.split("/")[0]}
                            </div>
                            <div className="text-muted-foreground">
                              {event.date.split("/")[1]}/
                              {event.date.split("/")[2].slice(-2)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {event.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {event.time} - {event.location}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => {
                      // Primeiro seta como null para depois setar o valor desejado
                      setInitialEventType(null);
                      setTimeout(() => {
                        setInitialEventType("audiencia");
                        setDialogOpen(true);
                      }, 10);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Audiência
                  </Button>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => {
                      setInitialEventType(null);
                      setTimeout(() => {
                        setInitialEventType("reuniao");
                        setDialogOpen(true);
                      }, 10);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Reunião
                  </Button>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => {
                      setInitialEventType(null);
                      setTimeout(() => {
                        setInitialEventType("prazo");
                        setDialogOpen(true);
                      }, 10);
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Definir Prazo
                  </Button>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    💡 Dicas de Produtividade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-800">
                        Configurar Lembretes
                      </p>
                      <p className="text-blue-600 mt-1">
                        Adicione lembretes automáticos para não perder prazos
                        importantes.
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-800">
                        Sincronização Automática
                      </p>
                      <p className="text-green-600 mt-1">
                        Eventos criados no sistema são automaticamente
                        sincronizados com o Google Calendar.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarManagement;
