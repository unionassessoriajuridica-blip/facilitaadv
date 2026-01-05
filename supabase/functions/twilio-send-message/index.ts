// supabase/functions/twilio-send-message/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, message } = await req.json();

    // OBS: Na API Oficial, as variáveis necessárias são:
    // WHATSAPP_API_TOKEN (Seu Token de Acesso Permanente ou Temporário)
    // WHATSAPP_PHONE_ID (O ID do número de telefone no painel da Meta)
    
    const apiToken = Deno.env.get('WHATSAPP_API_TOKEN');
    const phoneId = Deno.env.get('WHATSAPP_PHONE_ID'); 

    if (!apiToken || !phoneId) {
      throw new Error('Credenciais do WhatsApp (Token ou Phone ID) não configuradas no Supabase.');
    }

    // Limpeza do telefone (A API Oficial exige DDI+DDD+Numero, ex: 5516999999999)
    // Remove caracteres não numéricos
    let formattedPhone = phone.replace(/\D/g, '');

    console.log(`Enviando mensagem oficial para: ${formattedPhone}`);

    // URL oficial da Meta (Cloud API)
    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: { // A estrutura que a Meta exige é assim
        preview_url: false,
        body: message
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Erro API Meta:', JSON.stringify(responseData, null, 2));
      return new Response(JSON.stringify({ 
        error: 'Falha ao enviar mensagem via Meta',
        details: responseData 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Mensagem enviada via API Oficial',
      data: responseData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro interno:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
