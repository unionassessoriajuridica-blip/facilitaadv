import * as React from "react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

interface CreateEventParams {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  timeZone?: string;
}

export const useGoogleCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const transformGoogleEvent = React.useCallback((item: any): CalendarEvent => ({
    id: item.id,
    title: item.summary || "Sem título",
    description: item.description,
    start: new Date(item.start.dateTime || item.start.date),
    end: new Date(item.end.dateTime || item.end.date),
    location: item.location,
    attendees: item.attendees?.map((a: any) => a.email) || [],
    type: getEventType(item.summary || ""),
    status: item.status || "confirmed",
  }), []);

  const loadEvents = React.useCallback(async (facilitaOnly: boolean = false) => {
    setLoading(true);
    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

      const url = `/api/google/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}${facilitaOnly ? '&facilitaOnly=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao carregar eventos");
      }

      const data = await response.json();
      const formattedEvents = data.map(transformGoogleEvent) || [];
      setEvents(formattedEvents);
      return formattedEvents;
    } catch (error: any) {
      console.error("Erro ao carregar eventos:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [transformGoogleEvent]);

  const createEvent = React.useCallback(async (eventData: CreateEventParams) => {
    try {
      const response = await fetch('/api/google/calendar/events', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: eventData.summary,
          description: eventData.description,
          location: eventData.location,
          startDateTime: eventData.start,
          endDateTime: eventData.end,
          attendees: eventData.attendees,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const createdEvent = await response.json();
      toast({
        title: "Sucesso",
        description: "Evento criado e sincronizado com Google Calendar.",
      });

      await loadEvents();
      return createdEvent;
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento no Google Calendar.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, loadEvents]);

  const deleteEvent = React.useCallback(async (eventId: string) => {
    try {
      const response = await fetch(`/api/google/calendar/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "Sucesso",
        description: "Evento removido do Google Calendar.",
      });

      await loadEvents();
      return true;
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o evento do Google Calendar.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, loadEvents]);

  const getEventType = (summary: string): CalendarEvent["type"] => {
    const lowerSummary = summary.toLowerCase();
    if (lowerSummary.includes("audiencia") || lowerSummary.includes("audiência")) return "audiencia";
    if (lowerSummary.includes("reuniao") || lowerSummary.includes("reunião")) return "reuniao";
    if (lowerSummary.includes("prazo")) return "prazo";
    return "outros";
  };

  return React.useMemo(() => ({
    events,
    loading,
    loadEvents,
    createEvent,
    deleteEvent,
  }), [events, loading, loadEvents, createEvent, deleteEvent]);
};
