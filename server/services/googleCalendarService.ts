import { google, calendar_v3 } from 'googleapis';
import { googleSystemAuthService } from './googleSystemAuthService';

const EVENT_PREFIX = '[FACILITA ADV]';

async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  const oauth2Client = await googleSystemAuthService.getOAuth2ClientWithToken();
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function isConnected(): Promise<boolean> {
  return googleSystemAuthService.isConnected();
}

interface CreateEventOptions {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  colorId?: string;
}

export async function createEvent(options: CreateEventOptions): Promise<calendar_v3.Schema$Event> {
  const calendar = await getCalendarClient();
  
  const event: calendar_v3.Schema$Event = {
    summary: `${EVENT_PREFIX} ${options.summary}`,
    description: options.description,
    location: options.location,
    start: {
      dateTime: options.startDateTime,
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: options.endDateTime,
      timeZone: 'America/Sao_Paulo',
    },
    attendees: options.attendees?.map(email => ({ email })),
    reminders: options.reminders || {
      useDefault: true,
    },
    colorId: options.colorId,
  };
  
  const result = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    sendUpdates: options.attendees?.length ? 'all' : 'none',
  });
  
  return result.data;
}

interface UpdateEventOptions extends Partial<CreateEventOptions> {
  eventId: string;
}

export async function updateEvent(options: UpdateEventOptions): Promise<calendar_v3.Schema$Event> {
  const calendar = await getCalendarClient();
  
  const event: calendar_v3.Schema$Event = {};
  
  if (options.summary) {
    event.summary = options.summary.startsWith(EVENT_PREFIX) 
      ? options.summary 
      : `${EVENT_PREFIX} ${options.summary}`;
  }
  if (options.description !== undefined) event.description = options.description;
  if (options.location !== undefined) event.location = options.location;
  if (options.startDateTime) {
    event.start = {
      dateTime: options.startDateTime,
      timeZone: 'America/Sao_Paulo',
    };
  }
  if (options.endDateTime) {
    event.end = {
      dateTime: options.endDateTime,
      timeZone: 'America/Sao_Paulo',
    };
  }
  if (options.attendees) {
    event.attendees = options.attendees.map(email => ({ email }));
  }
  if (options.colorId) event.colorId = options.colorId;
  
  const result = await calendar.events.patch({
    calendarId: 'primary',
    eventId: options.eventId,
    requestBody: event,
    sendUpdates: options.attendees?.length ? 'all' : 'none',
  });
  
  return result.data;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const calendar = await getCalendarClient();
  
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
    sendUpdates: 'all',
  });
}

export async function getEvent(eventId: string): Promise<calendar_v3.Schema$Event> {
  const calendar = await getCalendarClient();
  
  const result = await calendar.events.get({
    calendarId: 'primary',
    eventId,
  });
  
  return result.data;
}

interface ListEventsOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  query?: string;
  showDeleted?: boolean;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
}

export async function listEvents(options: ListEventsOptions = {}): Promise<calendar_v3.Schema$Event[]> {
  const calendar = await getCalendarClient();
  
  const result = await calendar.events.list({
    calendarId: 'primary',
    timeMin: options.timeMin || new Date().toISOString(),
    timeMax: options.timeMax,
    maxResults: options.maxResults || 50,
    singleEvents: options.singleEvents ?? true,
    orderBy: options.orderBy || 'startTime',
    q: options.query,
    showDeleted: options.showDeleted ?? false,
  });
  
  return result.data.items || [];
}

export async function listFacilitaEvents(options: ListEventsOptions = {}): Promise<calendar_v3.Schema$Event[]> {
  const allEvents = await listEvents(options);
  
  return allEvents.filter(event => 
    event.summary?.startsWith(EVENT_PREFIX)
  );
}

export async function getCalendarInfo(): Promise<{
  id: string;
  summary: string;
  timeZone: string;
}> {
  const calendar = await getCalendarClient();
  
  const result = await calendar.calendars.get({
    calendarId: 'primary',
  });
  
  return {
    id: result.data.id || '',
    summary: result.data.summary || '',
    timeZone: result.data.timeZone || 'America/Sao_Paulo',
  };
}

export const googleCalendarService = {
  isConnected,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  listEvents,
  listFacilitaEvents,
  getCalendarInfo,
};
