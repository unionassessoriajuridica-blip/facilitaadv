import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { templateId, submissionId } = await req.json();
    
    if (!templateId) {
      return new Response(
        JSON.stringify({ error: 'templateId é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const DOCUSEAL_API_URL = Deno.env.get('DOCUSEAL_BASE_URL');
    const DOCUSEAL_API_KEY = Deno.env.get('DOCUSEAL_API_KEY');

    if (!DOCUSEAL_API_URL || !DOCUSEAL_API_KEY) {
      throw new Error('Variáveis de ambiente do DocuSeal não configuradas');
    }

    let url: string;

    if (submissionId) {
      // Endpoint para download de submission (documento assinado)
      const response = await fetch(
        `${DOCUSEAL_API_URL}/submissions/${submissionId}`,
        {
          method: 'GET',
          headers: {
            'X-Auth-Token': DOCUSEAL_API_KEY, // Correção: usar X-Auth-Token
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao obter submission: ${response.status}`);
      }

      const submission = await response.json();
      
      if (!submission.documents || submission.documents.length === 0) {
        throw new Error('Submission não possui documentos');
      }

      url = submission.documents[0].url;
    } else {
      // Endpoint para download de template
      const response = await fetch(
        `${DOCUSEAL_API_URL}/templates/${templateId}/documents`,
        {
          method: 'GET',
          headers: {
            'X-Auth-Token': DOCUSEAL_API_KEY, 
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao obter template: ${response.status}`);
      }

      const template = await response.json();
      
      if (!template.documents || template.documents.length === 0) {
        throw new Error('Template não possui documentos');
      }

      url = template.documents[0].url;
    }

    return new Response(
      JSON.stringify({ url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});