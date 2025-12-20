import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verifique se a chave API existe
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, simulating email');
      // Modo simulação para desenvolvimento
      const { invitationId, email, nome } = await req.json();
      
      return new Response(JSON.stringify({ 
        success: true,
        warning: 'Email simulation mode - RESEND_API_KEY not configured',
        email: email,
        nome: nome
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resend = new Resend(resendApiKey);

    const { invitationId, email, nome, inviterName } = await req.json()

    if (!invitationId || !email || !nome) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('user_invitations')
      .select('token, permissions')
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invitation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const acceptUrl = `${req.headers.get('origin') || 'https://app.com'}/accept-invitation?token=${invitation.token}`

    const permissionLabels = {
      'financeiro': 'Financeiro',
      'ia_facilita': 'IA Facilita',
      'facilisign': 'FaciliSign',
      'novo_processo': 'Novo Processo',
      'google_integration': 'Integração Google',
      'agenda': 'Agenda',
      'modificar_clientes': 'Modificar Clientes',
      'excluir_processo': 'Excluir Processo'
    }

    const permissionsList = invitation.permissions
      .map((p: string) => permissionLabels[p as keyof typeof permissionLabels] || p)
      .join(', ')

    const emailResponse = await resend.emails.send({
      from: "FacilitaAdv <noreply@noreply.facilita.adv.br>", 
      to: [email],
      subject: "Convite para acessar o FacilitaAdv",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin: 0;">FacilitaAdv</h1>
            <p style="color: #64748b; margin: 5px 0;">Sistema de Gestão Jurídica</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá ${nome}!</h2>
            <p style="color: #475569; line-height: 1.6;">
              Você foi convidado por <strong>${inviterName || 'um administrador'}</strong> para acessar o sistema FacilitaAdv.
            </p>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 10px;">Suas permissões:</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #6366f1;">
                <p style="color: #475569; margin: 0;">${permissionsList}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" 
                 style="background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                Aceitar Convite
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
              <strong>Importante:</strong> Este convite expira em 7 dias. Se você não conseguir clicar no botão, copie e cole este link no seu navegador:
            </p>
            <p style="color: #6366f1; font-size: 14px; word-break: break-all;">
              ${acceptUrl}
            </p>
          </div>
          
          <div style="text-align: center; color: #64748b; font-size: 12px;">
            <p>Este é um email automático, por favor não responda.</p>
            <p>© 2024 FacilitaAdv. Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      return new Response(JSON.stringify({ error: 'Failed to send email: ' + emailResponse.error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      success: true,
      emailId: emailResponse.data?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Send invitation email error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})