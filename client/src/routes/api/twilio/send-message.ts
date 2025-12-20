// src/routes/api/whatsapp/send-message.ts
import { Handlers } from '$fresh/server.ts';

export const handler: Handlers = {
  async POST(req) {
    try {
      const { phone, message } = await req.json();
      
      const apiUrl = Deno.env.get('WHATSAPP_API_URL');
      const apiToken = Deno.env.get('WHATSAPP_API_TOKEN');

      if (!apiUrl || !apiToken) {
        return new Response(JSON.stringify({ error: 'WhatsApp API credentials not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Chamada para a API não oficial de WhatsApp
      const response = await fetch(`${apiUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ 
          error: `WhatsApp API error: ${response.status}`,
          details: responseData 
        }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error in WhatsApp proxy:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};