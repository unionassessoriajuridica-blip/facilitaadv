// supabase/functions/twilio-send-message/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar se é uma requisição de preflight CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const { phone, message } = await req.json();
    
    const apiUrl = Deno.env.get('WHATSAPP_API_URL');
    const apiToken = Deno.env.get('WHATSAPP_API_TOKEN');

    if (!apiUrl || !apiToken) {
      return new Response(JSON.stringify({ 
        error: 'WhatsApp API credentials not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validar e formatar o telefone
    const formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone) {
      return new Response(JSON.stringify({ 
        error: 'Número de telefone inválido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Enviando mensagem para:', formattedPhone);

    const response = await fetch(`${apiUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Erro da API WhatsApp:', responseData);
      return new Response(JSON.stringify({ 
        error: `WhatsApp API error: ${response.status}`,
        details: responseData
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: responseData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in WhatsApp function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});