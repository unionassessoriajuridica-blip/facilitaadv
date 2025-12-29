import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Calendar,
  Clock,
  Plus,
  Users,
  MapPin,
  Bell,
  Video,
  RefreshCw,
  Settings,
  ExternalLink,
  Check,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { useGoogleAuth } from "@/hooks/useGoogleAuth.ts";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Calendar as CalendarComponent } from "@/components/ui/calendar.tsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils.ts";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  type: "audiencia" | "reuniao" | "prazo" | "outros";
  status: "confirmed" | "tentative" | "cancelled";
}

interface GoogleCalendarCardProps {
  isConnected?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  googleAuth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    userInfo?: { name: string; id: string; email?: string } | null;
  };
  googleCalendar: {
    events: CalendarEvent[];
    loading: boolean;
    loadEvents: (facilitaOnly?: boolean) => Promise<any>;
    createEvent: (eventData: any) => Promise<any>;
  };
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
  initialType?: "audiencia" | "reuniao" | "prazo" | "outros" | null;
}

export const GoogleCalendarCard: React.FC<GoogleCalendarCardProps> = ({
  isConnected,
  onConnect,
  onDisconnect,
  googleAuth,
  googleCalendar,
  dialogOpen = false,
  onDialogOpenChange,
  initialType = null,
}) => {
  const { toast } = useToast();
  const [showNewEventDialog, setShowNewEventDialog] = useState(dialogOpen);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [newEvent, setNewEvent] = useState<{
    title: string;
    description: string;
    start: string;
    end: string;
    location: string;
    attendees: string;
    type: "audiencia" | "reuniao" | "prazo" | "outros";
  }>({
    title: "",
    description: "",
    start: "",
    end: "",
    location: "",
    attendees: "",
    type: "reuniao",
  });

  // Sync internal state with controlled prop
  useEffect(() => {
    setShowNewEventDialog(dialogOpen);
  }, [dialogOpen]);

  // Pre-set type when dialog opens with initialType
  useEffect(() => {
    if (dialogOpen && initialType) {
      setNewEvent((prev) => ({ ...prev, type: initialType }));
    }
  }, [dialogOpen, initialType]);

  // Update parent when dialog open changes
  const handleDialogOpenChange = (open: boolean) => {
    setShowNewEventDialog(open);
    if (onDialogOpenChange) onDialogOpenChange(open);
  };

  useEffect(() => {
    if (googleAuth.isAuthenticated) {
      googleCalendar.loadEvents();
    }
  }, [googleAuth.isAuthenticated]);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
      summary: newEvent.title,
      description: newEvent.description,
      start: new Date(newEvent.start).toISOString(),
      end: new Date(newEvent.end).toISOString(),
      location: newEvent.location,
      attendees: newEvent.attendees
        ? newEvent.attendees.split(",").map((e) => e.trim())
        : [],
    };

    const success = await googleCalendar.createEvent(eventData);

    if (success) {
      handleDialogOpenChange(false);
      setShowNewEventDialog(false);
      setNewEvent({
        title: "",
        description: "",
        start: "",
        end: "",
        location: "",
        attendees: "",
        type: "reuniao",
      });
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "audiencia":
        return "bg-red-100 text-red-800 border-red-200";
      case "reuniao":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "prazo":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "audiencia":
        return "Audiência";
      case "reuniao":
        return "Reunião";
      case "prazo":
        return "Prazo";
      default:
        return "Outros";
    }
  };

  if (!googleAuth.isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Google Calendar</CardTitle>
              <p className="text-sm text-muted-foreground">
                Integre sua agenda jurídica
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Conecte sua conta Google
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Para usar o Google Calendar, você precisa primeiro conectar sua
                conta Google.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">
              Funcionalidades disponíveis:
            </h4>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Sincronizar audiências e prazos</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Lembretes automáticos</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Convidar clientes para reuniões</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onConnect}
            disabled={googleAuth.isLoading}
            className="w-full"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {googleAuth.isLoading
              ? "Verificando..."
              : "Conectar Google Calendar"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                Google Calendar
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Conectado
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Agenda jurídica sincronizada
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => googleCalendar.loadEvents()}
              disabled={googleCalendar.loading}
            >
              {googleCalendar.loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>

            <Dialog
              open={showNewEventDialog}
              onOpenChange={handleDialogOpenChange}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                  <DialogDescription>
                    Crie um novo evento que será sincronizado com seu Google
                    Calendar
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Ex: Audiência - Processo 123..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo do Evento</Label>
                    <Select
                      value={newEvent.type}
                      onValueChange={(value: any) =>
                        setNewEvent((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="audiencia">🏛️ Audiência</SelectItem>
                        <SelectItem value="reuniao">👥 Reunião</SelectItem>
                        <SelectItem value="prazo">⏰ Prazo</SelectItem>
                        <SelectItem value="outros">📋 Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start">Data/Hora Início *</Label>
                      <Input
                        id="start"
                        type="datetime-local"
                        value={newEvent.start}
                        onChange={(e) =>
                          setNewEvent((prev) => ({
                            ...prev,
                            start: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="end">Data/Hora Fim *</Label>
                      <Input
                        id="end"
                        type="datetime-local"
                        value={newEvent.end}
                        onChange={(e) =>
                          setNewEvent((prev) => ({
                            ...prev,
                            end: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="location">Local</Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) =>
                        setNewEvent((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Ex: Fórum Central - Sala 301"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="attendees">Participantes (emails)</Label>
                    <Input
                      id="attendees"
                      value={newEvent.attendees}
                      onChange={(e) =>
                        setNewEvent((prev) => ({
                          ...prev,
                          attendees: e.target.value,
                        }))
                      }
                      placeholder="cliente@email.com, advogado@email.com"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Detalhes adicionais sobre o evento..."
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewEventDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateEvent}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Criar Evento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {googleCalendar.loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Carregando eventos...
            </p>
          </div>
        ) : googleCalendar.events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum evento encontrado
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Crie seu primeiro evento clicando em "Novo Evento"
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Próximos Eventos</h4>
              <Badge variant="outline">
                {googleCalendar.events.length} eventos
              </Badge>
            </div>

            {googleCalendar.events.map((event) => (
              <div
                key={event.id}
                className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center min-w-[60px]">
                  <div className="text-xs text-muted-foreground">
                    {format(event.start, "dd/MM", { locale: ptBR })}
                  </div>
                  <div className="text-sm font-medium">
                    {format(event.start, "HH:mm", { locale: ptBR })}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">
                        {event.title}
                      </h5>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {event.description.length > 100
                            ? event.description.substring(0, 100).replace(/https?:\/\/\S+/g, '[link]') + "..."
                            : event.description.replace(/https?:\/\/\S+/g, '[link]')}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{event.attendees.length} participantes</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn("text-xs", getEventTypeColor(event.type))}
                    >
                      {getEventTypeLabel(event.type)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onDisconnect}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
              {googleAuth.userInfo?.email && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {googleAuth.userInfo.email}
                </span>
              )}
            </div>

            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir Google Calendar
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
