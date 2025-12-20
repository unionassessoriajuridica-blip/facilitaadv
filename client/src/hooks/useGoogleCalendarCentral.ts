import { useState, useEffect, useCallback } from "react";
import { googleCalendarSecure } from "@/services/googleCalendarSecureService";
import { useToast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  type: string;
  status: string;
}

interface CreateEventParams {
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  type?: "audiencia" | "reuniao" | "prazo" | "outros";
  processId?: string;
}

export function useGoogleCalendarCentral() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    try {
      const connected = await googleCalendarSecure.isConnected();
      setIsConnected(connected);
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const createEvent = useCallback(
    async (params: CreateEventParams): Promise<CalendarEvent | null> => {
      if (!isConnected) {
        toast({
          title: "Google Calendar não conectado",
          description: "Configure a integração nas configurações do sistema.",
          variant: "destructive",
        });
        return null;
      }

      try {
        const event = await googleCalendarSecure.createEvent(params);
        if (event) {
          toast({
            title: "Evento criado",
            description: `"${params.title}" foi adicionado ao Google Calendar.`,
          });
          return {
            id: event.id,
            title: event.title,
            description: event.description,
            start: new Date(event.start),
            end: new Date(event.end),
            location: event.location,
            attendees: [],
            type: event.type,
            status: "confirmed",
          };
        }
        return null;
      } catch (error) {
        console.error("Erro ao criar evento:", error);
        toast({
          title: "Erro ao criar evento",
          description: "Não foi possível adicionar o evento ao Google Calendar.",
          variant: "destructive",
        });
        return null;
      }
    },
    [isConnected, toast]
  );

  const updateEvent = useCallback(
    async (
      _eventId: string,
      _params: Partial<CreateEventParams>
    ): Promise<CalendarEvent | null> => {
      if (!isConnected) return null;
      toast({
        title: "Em desenvolvimento",
        description: "A atualização de eventos será implementada em breve.",
      });
      return null;
    },
    [isConnected, toast]
  );

  const deleteEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (!isConnected) return false;

      try {
        const success = await googleCalendarSecure.deleteEvent(eventId);
        if (success) {
          toast({
            title: "Evento removido",
            description: "O evento foi removido do Google Calendar.",
          });
        }
        return success;
      } catch (error) {
        console.error("Erro ao deletar evento:", error);
        return false;
      }
    },
    [isConnected, toast]
  );

  const loadEvents = useCallback(async (maxResults = 50) => {
    if (!isConnected) return [];

    try {
      const loadedEvents = await googleCalendarSecure.listEvents(maxResults);
      const formattedEvents = loadedEvents.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start: new Date(e.start),
        end: new Date(e.end),
        location: e.location,
        attendees: [],
        type: e.type,
        status: "confirmed",
      }));
      setEvents(formattedEvents);
      return formattedEvents;
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      return [];
    }
  }, [isConnected]);

  const createAudienciaEvent = useCallback(
    async (audiencia: {
      titulo: string;
      descricao?: string;
      data: string;
      hora: string;
      local?: string;
      processoId?: string;
    }) => {
      try {
        const result = await googleCalendarSecure.createAudienciaEvent(audiencia);
        if (result) {
          toast({
            title: "Audiência agendada",
            description: `"${audiencia.titulo}" foi adicionada ao Google Calendar.`,
          });
          return {
            id: result.id,
            title: result.title,
            description: result.description,
            start: new Date(result.start),
            end: new Date(result.end),
            location: result.location,
            attendees: [],
            type: "audiencia",
            status: "confirmed",
          };
        }
        return null;
      } catch (error) {
        console.error("Erro ao criar audiência:", error);
        return null;
      }
    },
    [toast]
  );

  const createPrazoEvent = useCallback(
    async (prazo: {
      titulo: string;
      descricao?: string;
      dataLimite: string;
      processoId?: string;
    }) => {
      try {
        const result = await googleCalendarSecure.createPrazoEvent(prazo);
        if (result) {
          toast({
            title: "Prazo cadastrado",
            description: `"${prazo.titulo}" foi adicionado ao Google Calendar.`,
          });
          return {
            id: result.id,
            title: result.title,
            description: result.description,
            start: new Date(result.start),
            end: new Date(result.end),
            location: result.location,
            attendees: [],
            type: "prazo",
            status: "confirmed",
          };
        }
        return null;
      } catch (error) {
        console.error("Erro ao criar prazo:", error);
        return null;
      }
    },
    [toast]
  );

  const createReuniaoEvent = useCallback(
    async (reuniao: {
      titulo: string;
      descricao?: string;
      data: string;
      horaInicio: string;
      horaFim: string;
      local?: string;
      participantes?: string[];
    }) => {
      try {
        const result = await googleCalendarSecure.createReuniaoEvent(reuniao);
        if (result) {
          toast({
            title: "Reunião agendada",
            description: `"${reuniao.titulo}" foi adicionada ao Google Calendar.`,
          });
          return {
            id: result.id,
            title: result.title,
            description: result.description,
            start: new Date(result.start),
            end: new Date(result.end),
            location: result.location,
            attendees: [],
            type: "reuniao",
            status: "confirmed",
          };
        }
        return null;
      } catch (error) {
        console.error("Erro ao criar reunião:", error);
        return null;
      }
    },
    [toast]
  );

  return {
    isConnected,
    isLoading,
    events,
    checkConnection,
    createEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
    createAudienciaEvent,
    createPrazoEvent,
    createReuniaoEvent,
  };
}
