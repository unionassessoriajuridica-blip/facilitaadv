import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  CheckSquare,
  Calendar,
  FileText,
  PenTool,
  AlertTriangle,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface AlertItem {
  id: string;
  type: "tarefa" | "prazo" | "evento" | "assinatura";
  title: string;
  description?: string;
  date: Date;
  priority?: "alta" | "media" | "baixa";
  status?: string;
  link?: string;
  processoId?: string;
  processoNumero?: string;
  isAllDay?: boolean;
}

export function AlertasCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);

  const loadAlerts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const allAlerts: AlertItem[] = [];

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (accessToken) {
        const response = await fetch("/api/alerts", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.alerts && Array.isArray(data.alerts)) {
            data.alerts.forEach((alert: any) => {
              try {
                const dateStr = alert.date;
                let alertDate: Date | undefined;

                if (dateStr) {
                  if (dateStr.includes("T")) {
                    alertDate = new Date(dateStr);
                  } else {
                    alertDate = parseISO(dateStr);
                  }
                  if (isNaN(alertDate.getTime())) {
                    alertDate = undefined;
                  }
                }

                allAlerts.push({
                  id: alert.id,
                  type: alert.type as "tarefa" | "prazo" | "evento" | "assinatura",
                  title: alert.title,
                  description: alertDate ? alert.description : `${alert.description || ""} (Sem data definida)`.trim(),
                  date: alertDate || new Date(9999, 11, 31),
                  priority: alert.priority,
                  status: alert.status,
                  processoId: alert.processoId,
                  processoNumero: alert.processoNumero,
                });
              } catch (e) {
                console.warn("Invalid alert:", alert.id);
              }
            });
          }
        }
      }

      // Buscar eventos do calendário via API do sistema
      try {
        const calendarStatusRes = await fetch("/api/google/calendar/status"); // Corrigido prefixo
        const calendarStatus = await calendarStatusRes.json();

        setCalendarConnected(calendarStatus.connected === true);

        if (calendarStatus.connected) {
          // Buscar eventos dos próximos 7 dias
          const now = new Date();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);

          const eventsRes = await fetch(`/api/google/calendar/events?timeMin=${now.toISOString()}&timeMax=${futureDate.toISOString()}`);
          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            const events = Array.isArray(eventsData) ? eventsData : (eventsData.events || []);

            events.forEach((event: any) => {
              try {
                let eventDate: Date;
                let isAllDay = false;

                if (event.start?.dateTime) {
                  eventDate = new Date(event.start.dateTime);
                } else if (event.start?.date) {
                  const [year, month, day] = event.start.date.split("-").map(Number);
                  eventDate = new Date(year, month - 1, day, 12, 0, 0);
                  isAllDay = true;
                } else {
                  return;
                }

                if (!isNaN(eventDate.getTime())) {
                  allAlerts.push({
                    id: `evento-${event.id}`,
                    type: "evento",
                    title: event.summary || "Evento",
                    description: event.description || undefined,
                    date: eventDate,
                    isAllDay,
                  });
                }
              } catch (e) {
                console.warn("Invalid calendar event:", event.id);
              }
            });
          }
        }
      } catch (calendarError) {
        console.log("Calendar not connected or error:", calendarError);
        setCalendarConnected(false);
      }

      allAlerts.sort((a, b) => {
        const timeA = a.date?.getTime() || 0;
        const timeB = b.date?.getTime() || 0;
        return timeA - timeB;
      });
      setAlerts(allAlerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen, loadAlerts]);

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user, loadAlerts]);

  const isNoDate = (date: Date) => date.getFullYear() >= 9999;

  const getUrgencyBadge = (date: Date, type: string) => {
    if (type === "assinatura") {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
    }
    if (isNoDate(date)) {
      return <Badge variant="secondary">Sem data</Badge>;
    }
    if (isPast(date) && !isToday(date)) {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Atrasado</Badge>;
    }
    if (isToday(date)) {
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Hoje</Badge>;
    }
    if (isTomorrow(date)) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Amanha</Badge>;
    }
    return <Badge variant="secondary">{format(date, "dd/MM", { locale: ptBR })}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tarefa":
        return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case "prazo":
        return <FileText className="w-4 h-4 text-purple-500" />;
      case "evento":
        return <Calendar className="w-4 h-4 text-green-500" />;
      case "assinatura":
        return <PenTool className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleAlertClick = (alert: AlertItem) => {
    if (alert.type === "assinatura") {
      // Documentos de assinatura: verificar origem
      if (alert.processoId) {
        // Documento veio de um processo - navegar para o processo na aba de assinatura
        navigate(`/processo/${alert.processoId}`);
      } else {
        // Documento veio do FaciliSign diretamente
        navigate("/facilisign");
      }
      setIsOpen(false);
      return;
    }

    if (alert.processoId) {
      navigate(`/processo/${alert.processoId}`);
      setIsOpen(false);
    }
  };

  const filterAlerts = (type: string) => {
    if (type === "todos") return alerts;
    return alerts.filter((a) => a.type === type);
  };

  const urgentCount = alerts.filter((a) => {
    if (a.type === "assinatura") return true;
    return isPast(a.date) || isToday(a.date) || isTomorrow(a.date);
  }).length;

  const totalCount = alerts.length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-alertas-center"
        >
          <Bell className="w-5 h-5" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Central de Alertas
            {urgentCount > 0 && (
              <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                {urgentCount} urgente{urgentCount > 1 ? "s" : ""}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="todos" className="h-[calc(100vh-120px)]">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="todos" className="text-xs" data-testid="tab-todos">
              Todos
              {totalCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                  {totalCount}
                </Badge>
              )}
            </TabsTrigger>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="tarefa" className="text-xs" data-testid="tab-tarefas">
                  <CheckSquare className="w-3 h-3" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Tarefas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="prazo" className="text-xs" data-testid="tab-prazos">
                  <FileText className="w-3 h-3" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Prazos</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="evento" className="text-xs" data-testid="tab-eventos">
                  <Calendar className="w-3 h-3" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Eventos</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="assinatura" className="text-xs" data-testid="tab-assinaturas">
                  <PenTool className="w-3 h-3" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>Assinaturas</TooltipContent>
            </Tooltip>
          </TabsList>

          {["todos", "tarefa", "prazo", "evento", "assinatura"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="mt-4 h-full">
              <ScrollArea className="h-[calc(100vh-220px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tabValue === "evento" && calendarConnected === false ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Google Calendar nao conectado
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      Acesse Configuracoes {">"} Integracoes Google para conectar
                    </p>
                  </div>
                ) : filterAlerts(tabValue).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum alerta encontrado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-4">
                    {filterAlerts(tabValue).map((alert) => (
                      <Card
                        key={alert.id}
                        className="cursor-pointer hover-elevate transition-all"
                        onClick={() => handleAlertClick(alert)}
                        data-testid={`alert-item-${alert.id}`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getTypeIcon(alert.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium truncate">
                                  {alert.title}
                                </p>
                                {getUrgencyBadge(alert.date, alert.type)}
                              </div>
                              {alert.description && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {alert.description}
                                </p>
                              )}
                              {alert.processoNumero && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {alert.processoNumero}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {alert.isAllDay
                                  ? format(alert.date, "dd/MM/yyyy", { locale: ptBR }) + " (dia inteiro)"
                                  : format(alert.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                }
                              </div>
                            </div>
                            {alert.processoId && (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
