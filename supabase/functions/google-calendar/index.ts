// Supabase Edge Function para Google Calendar
// Deploy: supabase functions deploy google-calendar

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
const EVENT_PREFIX = "[FACILITA ADV]"

interface GoogleIntegration {
  id: string
  access_token: string
  refresh_token: string
  calendar_id: string
  expires_at: string
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")

  if (!clientId || !clientSecret) {
    console.error("Missing Google credentials")
    return null
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    console.error("Failed to refresh token:", await response.text())
    return null
  }

  const data = await response.json()
  return data.access_token
}

async function getValidAccessToken(
  supabase: any,
  integration: GoogleIntegration
): Promise<string | null> {
  const expiresAt = new Date(integration.expires_at)
  const now = new Date()

  if (expiresAt > now) {
    return integration.access_token
  }

  const newToken = await refreshAccessToken(integration.refresh_token)
  if (newToken) {
    const newExpiresAt = new Date()
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + 3600)

    await supabase
      .from("google_integration")
      .update({
        access_token: newToken,
        expires_at: newExpiresAt.toISOString(),
      })
      .eq("id", integration.id)
  }

  return newToken
}

async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventData: any
): Promise<any> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Failed to create event")
  }

  return await response.json()
}

async function getUpcomingEvents(
  accessToken: string,
  calendarId: string,
  maxResults = 50
): Promise<any[]> {
  const now = new Date().toISOString()
  const url = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?` +
    new URLSearchParams({
      timeMin: now,
      maxResults: maxResults.toString(),
      singleEvents: "true",
      orderBy: "startTime",
      q: EVENT_PREFIX,
    })

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch events")
  }

  const data = await response.json()
  return data.items || []
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: integration, error: intError } = await supabase
      .from("google_integration")
      .select("*")
      .eq("is_active", true)
      .single()

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: "Google Calendar not configured", is_connected: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const accessToken = await getValidAccessToken(supabase, integration)
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Failed to get valid access token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { action, ...params } = await req.json()

    switch (action) {
      case "status": {
        return new Response(
          JSON.stringify({
            is_connected: true,
            calendar_id: integration.calendar_id,
            calendar_name: integration.calendar_name,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      case "exchange_code": {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single()

        if (!userRole || !["master", "admin"].includes(userRole.role)) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }

        const { code, redirectUri } = params
        const clientId = Deno.env.get("GOOGLE_CLIENT_ID")
        const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")

        if (!clientId || !clientSecret) {
          return new Response(
            JSON.stringify({ error: "Google credentials not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          return new Response(
            JSON.stringify({ error: errorData.error_description || "Token exchange failed" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }

        const tokenData = await tokenResponse.json()

        const calendarResponse = await fetch(
          "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary",
          { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
        )

        let calendarName = "Calendário Principal"
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json()
          calendarName = calendarData.summary || calendarName
        }

        await supabase
          .from("google_integration")
          .update({ is_active: false })
          .eq("is_active", true)

        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

        const { error: insertError } = await supabase
          .from("google_integration")
          .insert({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            calendar_id: "primary",
            calendar_name: calendarName,
            expires_at: expiresAt.toISOString(),
            connected_by: user.id,
            is_active: true,
          })

        if (insertError) {
          return new Response(
            JSON.stringify({ error: "Failed to save integration" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, calendar_name: calendarName }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      case "create_event": {
        const { title, description, start, end, location, type, processId } = params

        const eventData = {
          summary: `${EVENT_PREFIX} ${title}`,
          description: description || "",
          location: location || "",
          start: {
            dateTime: start,
            timeZone: "America/Sao_Paulo",
          },
          end: {
            dateTime: end,
            timeZone: "America/Sao_Paulo",
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 24 * 60 },
              { method: "popup", minutes: 30 },
            ],
          },
          extendedProperties: {
            private: {
              facilitaAdv: "true",
              type: type || "outros",
              processId: processId || "",
            },
          },
        }

        const createdEvent = await createCalendarEvent(
          accessToken,
          integration.calendar_id || "primary",
          eventData
        )

        return new Response(
          JSON.stringify({
            success: true,
            event: {
              id: createdEvent.id,
              title: createdEvent.summary,
              start: createdEvent.start?.dateTime,
              end: createdEvent.end?.dateTime,
              htmlLink: createdEvent.htmlLink,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      case "list_events": {
        const events = await getUpcomingEvents(
          accessToken,
          integration.calendar_id || "primary",
          params.maxResults || 50
        )

        return new Response(
          JSON.stringify({
            success: true,
            events: events.map((e: any) => ({
              id: e.id,
              title: e.summary?.replace(EVENT_PREFIX, "").trim() || "Sem título",
              description: e.description,
              start: e.start?.dateTime || e.start?.date,
              end: e.end?.dateTime || e.end?.date,
              location: e.location,
              type: e.extendedProperties?.private?.type || "outros",
              htmlLink: e.htmlLink,
            })),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      case "delete_event": {
        const { eventId } = params
        const calendarId = integration.calendar_id || "primary"

        const response = await fetch(
          `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        )

        return new Response(
          JSON.stringify({ success: response.ok || response.status === 404 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      case "disconnect": {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single()

        if (!userRole || !["master", "admin"].includes(userRole.role)) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }

        await supabase
          .from("google_integration")
          .update({ is_active: false })
          .eq("id", integration.id)

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
