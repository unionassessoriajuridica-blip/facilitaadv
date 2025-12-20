import { supabase } from "@/integrations/supabase/client";

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar`;

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  type: string;
  htmlLink?: string;
}

interface CreateEventParams {
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  type?: "audiencia" | "reuniao" | "prazo" | "outros";
  processId?: string;
}

interface IntegrationStatus {
  is_connected: boolean;
  calendar_id?: string;
  calendar_name?: string;
}

class GoogleCalendarSecureService {
  private static instance: GoogleCalendarSecureService;

  private constructor() {}

  static getInstance(): GoogleCalendarSecureService {
    if (!GoogleCalendarSecureService.instance) {
      GoogleCalendarSecureService.instance = new GoogleCalendarSecureService();
    }
    return GoogleCalendarSecureService.instance;
  }

  private async callEdgeFunction(action: string, params: Record<string, any> = {}): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Edge function error");
    }

    return await response.json();
  }

  async getStatus(): Promise<IntegrationStatus> {
    try {
      const result = await this.callEdgeFunction("status");
      return {
        is_connected: result.is_connected || false,
        calendar_id: result.calendar_id,
        calendar_name: result.calendar_name,
      };
    } catch (error) {
      console.error("Error checking status:", error);
      return { is_connected: false };
    }
  }

  async isConnected(): Promise<boolean> {
    const status = await this.getStatus();
    return status.is_connected;
  }

  async createEvent(params: CreateEventParams): Promise<CalendarEvent | null> {
    try {
      const result = await this.callEdgeFunction("create_event", params);
      
      if (result.success && result.event) {
        return result.event as CalendarEvent;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating event:", error);
      return null;
    }
  }

  async listEvents(maxResults = 50): Promise<CalendarEvent[]> {
    try {
      const result = await this.callEdgeFunction("list_events", { maxResults });
      
      if (result.success && result.events) {
        return result.events as CalendarEvent[];
      }
      
      return [];
    } catch (error) {
      console.error("Error listing events:", error);
      return [];
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const result = await this.callEdgeFunction("delete_event", { eventId });
      return result.success || false;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      const result = await this.callEdgeFunction("disconnect");
      return result.success || false;
    } catch (error) {
      console.error("Error disconnecting:", error);
      return false;
    }
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<{ success: boolean; calendar_name?: string; error?: string }> {
    try {
      const result = await this.callEdgeFunction("exchange_code", { code, redirectUri });
      return result;
    } catch (error) {
      console.error("Error exchanging code:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async createAudienciaEvent(audiencia: {
    titulo: string;
    descricao?: string;
    data: string;
    hora: string;
    local?: string;
    processoId?: string;
  }): Promise<CalendarEvent | null> {
    const start = new Date(`${audiencia.data}T${audiencia.hora}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    return this.createEvent({
      title: `Audiência - ${audiencia.titulo}`,
      description: audiencia.descricao,
      start: start.toISOString(),
      end: end.toISOString(),
      location: audiencia.local,
      type: "audiencia",
      processId: audiencia.processoId,
    });
  }

  async createPrazoEvent(prazo: {
    titulo: string;
    descricao?: string;
    dataLimite: string;
    processoId?: string;
  }): Promise<CalendarEvent | null> {
    const deadline = new Date(prazo.dataLimite);
    deadline.setHours(23, 59, 0, 0);
    const start = new Date(deadline);
    start.setHours(9, 0, 0, 0);

    return this.createEvent({
      title: `Prazo - ${prazo.titulo}`,
      description: prazo.descricao,
      start: start.toISOString(),
      end: deadline.toISOString(),
      type: "prazo",
      processId: prazo.processoId,
    });
  }

  async createReuniaoEvent(reuniao: {
    titulo: string;
    descricao?: string;
    data: string;
    horaInicio: string;
    horaFim: string;
    local?: string;
  }): Promise<CalendarEvent | null> {
    const start = new Date(`${reuniao.data}T${reuniao.horaInicio}`);
    const end = new Date(`${reuniao.data}T${reuniao.horaFim}`);

    return this.createEvent({
      title: `Reunião - ${reuniao.titulo}`,
      description: reuniao.descricao,
      start: start.toISOString(),
      end: end.toISOString(),
      location: reuniao.local,
      type: "reuniao",
    });
  }
}

export const googleCalendarSecure = GoogleCalendarSecureService.getInstance();
