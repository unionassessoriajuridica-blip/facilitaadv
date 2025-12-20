import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    console.log("Recebendo solicitação para enviar assinatura");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (!user || authError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { templateId, signatarios, documentoId } = await req.json();
    console.log("Dados recebidos:", { templateId, signatarios, documentoId });

    if (
      !templateId ||
      !signatarios ||
      !Array.isArray(signatarios) ||
      !documentoId
    ) {
      return new Response(
        JSON.stringify({
          error: "Template ID, document ID and signatarios are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const docusealApiKey = Deno.env.get("DOCUSEAL_API_KEY");
    const docusealBaseUrl = Deno.env.get("DOCUSEAL_BASE_URL");

    if (!docusealApiKey || !docusealBaseUrl) {
      return new Response(
        JSON.stringify({ error: "DocuSeal configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verifica se há pelo menos um signatário válido
    const validSigners = signatarios.filter((s) => s.nome && s.email);
    if (validSigners.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one valid signer is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Configurações DocuSeal:", {
      hasApiKey: !!docusealApiKey,
      hasBaseUrl: !!docusealBaseUrl,
      baseUrl: docusealBaseUrl,
      templateId: templateId,
    });

    // IMPORTANTE: Use roles específicas que correspondam às roles dos campos no template
    const submissionData = {
      template_id: parseInt(templateId),
      send_email: true,
      send_sms: false,
      order: "preserved",
      submitters: validSigners.map((sig, index) => {
        // Define roles específicas que correspondam aos campos do template
        let role;
        let fields = [];

        if (index === 0) {
          role = "First Party";
          // Campos para o primeiro signatário (CONTRATANTE)
          fields = [
            { name: "rubrica_contratante", required: true },
            { name: "assinatura_contratante", required: true },
            { name: "data_contratante", required: true },
          ];
        } else if (index === 1) {
          role = "Segunda Parte"; // ← MUDE PARA "Segunda Parte" (deve corresponder ao template)
          // Campos para o segundo signatário (CONTRATADO)
          fields = [
            { name: "rubrica_contratado", required: true },
            { name: "assinatura_contratado", required: true },
            { name: "data_contratado", required: true },
          ];
        } else {
          role = `Party ${index + 1}`;
        }

        return {
          name: sig.nome,
          email: sig.email,
          role: role,
          send_email: true,
          fields: fields,
          metadata: {
            documento_id: documentoId,
            user_id: user.id,
          },
        };
      }),
    };

    console.log(
      "Dados sendo enviados para DocuSeal:",
      JSON.stringify(submissionData, null, 2)
    );

    const response = await fetch(`${docusealBaseUrl}/submissions`, {
      method: "POST",
      headers: {
        "X-Auth-Token": docusealApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submissionData),
    }).catch((err) => {
      console.error("Erro na chamada à API DocuSeal:", err);
      throw err;
    });

    console.log("Resposta do DocuSeal - Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro detalhado do DocuSeal:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: `${docusealBaseUrl}/submissions`,
        submissionData,
      });

      throw new Error(
        `DocuSeal API error: ${response.status} - ${response.statusText} - ${errorText}`
      );
    }

    const docusealResponse = await response.json();
    console.log("Resposta completa do DocuSeal:", docusealResponse);

    // A resposta é um array - pegamos o primeiro submitter para obter o submission_id
    const firstSubmitter = Array.isArray(docusealResponse)
      ? docusealResponse[0]
      : docusealResponse;
    const submissionId = firstSubmitter?.submission_id;

    if (!submissionId) {
      throw new Error("No submission ID returned from DocuSeal");
    }

    // Atualiza o documento no Supabase usando o ID do documento
    const { error: updateError } = await supabaseClient
      .from("documentos_digitais")
      .update({
        docuseal_submission_id: submissionId,
        status: "ENVIADO_PARA_ASSINATURA",
        signatarios: validSigners,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentoId) // Use o ID específico do documento
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Erro ao atualizar banco de dados:", updateError);
      return new Response(
        JSON.stringify({
          error: "Database update failed",
          details: updateError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        submission: docusealResponse,
        submissionId: submissionId,
        message:
          "Solicitação de assinatura enviada com sucesso. Os signatários receberão emails para assinar.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
