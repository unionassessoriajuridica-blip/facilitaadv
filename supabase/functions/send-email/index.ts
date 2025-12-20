import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  type?: 'notification' | 'reminder' | 'report';
  clienteName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Send-email function started');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('✅ CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Processing email request...');
    const { to, subject, message, type, clienteName }: EmailRequest = await req.json();
    console.log('📧 Email data received:', { to, subject, type, messageLength: message.length });

    if (!to || !subject || !message) {
      console.error('❌ Missing required fields');
      throw new Error('Campos obrigatórios: to, subject, message');
    }

    // Verificar se a chave da Resend está configurada
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('🔑 Resend API Key status:', resendApiKey ? 'CONFIGURED' : 'NOT CONFIGURED');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não está configurada nos secrets do Supabase');
    }

    // Template de email baseado no tipo
    const getEmailTemplate = (type: string, message: string, clienteName?: string) => {
      const baseStyle = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Sistema Jurídico</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      `;

      const footer = `
          </div>
        </div>
      `;

      switch (type) {
        case 'notification':
          return `${baseStyle}
            <h2 style="color: #333; margin-bottom: 20px;">🔔 Notificação Importante</h2>
            ${clienteName ? `<p style="color: #666; margin-bottom: 15px;"><strong>Cliente:</strong> ${clienteName}</p>` : ''}
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
              ${message}
            </div>
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              Esta é uma notificação automática do seu sistema jurídico.
            </p>
            ${footer}`;

        case 'reminder':
          return `${baseStyle}
            <h2 style="color: #333; margin-bottom: 20px;">⏰ Lembrete de Prazo</h2>
            ${clienteName ? `<p style="color: #666; margin-bottom: 15px;"><strong>Cliente:</strong> ${clienteName}</p>` : ''}
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
              ${message}
            </div>
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              Não se esqueça de tomar as devidas providências.
            </p>
            ${footer}`;

        case 'report':
          return `${baseStyle}
            <h2 style="color: #333; margin-bottom: 20px;">📊 Relatório</h2>
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8;">
              ${message}
            </div>
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              Relatório gerado automaticamente pelo sistema.
            </p>
            ${footer}`;

        default:
          return `${baseStyle}
            <h2 style="color: #333; margin-bottom: 20px;">💼 Mensagem do Sistema</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              ${message}
            </div>
            ${footer}`;
      }
    };

    console.log('📨 Attempting to send email via Resend...');
    
    const emailResponse = await resend.emails.send({
      from: "Sistema Jurídico <noreply@resend.dev>", // Usando domínio padrão da Resend
      to: [to],
      subject: subject,
      html: getEmailTemplate(type || 'default', message, clienteName),
    });

    console.log("✅ Resend response:", emailResponse);

    // Verificar se houve erro na resposta da Resend
    if (emailResponse.error) {
      console.error("❌ Resend API error:", emailResponse.error);
      throw new Error(`Resend error: ${emailResponse.error.message || 'Unknown error'}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      resendResponse: emailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-email function:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);