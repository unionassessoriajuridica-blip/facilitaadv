import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' +
      hostname +
      '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        Accept: 'application/json',
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Get upcoming events
export async function getUpcomingEvents(maxResults = 10) {
  try {
    const calendar = await getGoogleCalendarClient();
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.data.items || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// Create event
export async function createEvent(eventDetails: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: Array<{ email: string }>;
}) {
  try {
    const calendar = await getGoogleCalendarClient();
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: { dateTime: eventDetails.start, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: eventDetails.end, timeZone: 'America/Sao_Paulo' },
        attendees: eventDetails.attendees,
      },
    });
    return res.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

// Update event
export async function updateEvent(
  eventId: string,
  eventDetails: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
  }
) {
  try {
    const calendar = await getGoogleCalendarClient();
    const res = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: eventDetails.start
          ? { dateTime: eventDetails.start, timeZone: 'America/Sao_Paulo' }
          : undefined,
        end: eventDetails.end
          ? { dateTime: eventDetails.end, timeZone: 'America/Sao_Paulo' }
          : undefined,
      },
    });
    return res.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

// Delete event
export async function deleteEvent(eventId: string) {
  try {
    const calendar = await getGoogleCalendarClient();
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}
