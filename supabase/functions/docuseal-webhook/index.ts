import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DOCUSEAL_WEBHOOK_SECRET = Deno.env.get("DOCUSEAL_WEBHOOK_SECRET");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // DEBUG: Log todos os headers para troubleshooting
    console.log("=== WEBHOOK HEADERS RECEIVED ===");
    for (const [key, value] of req.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    console.log("================================");

    // Validação APENAS se a secret estiver configurada E o header existir
    if (DOCUSEAL_WEBHOOK_SECRET && DOCUSEAL_WEBHOOK_SECRET !== "") {
      const signature = req.headers.get("x-docuseal-signature");
      if (signature) {
        console.log("Webhook signature received:", signature);
        // Aqui você pode adicionar validação da signature se necessário
      } else {
        console.log(
          "No signature header received, but webhook processing will continue"
        );
      }
    } else {
      console.log(
        "No DOCUSEAL_WEBHOOK_SECRET configured, skipping signature validation"
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    console.log(
      "Supabase URL:",
      Deno.env.get("SUPABASE_URL") ? "Configured" : "Missing"
    );
    console.log(
      "Service Role Key:",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "Configured" : "Missing"
    );
    const webhookData = await req.json();
    console.log(
      "DocuSeal webhook received - event_type:",
      webhookData.event_type
    );

    const { event_type, data } = webhookData;

    if (!data?.submission?.id) {
      console.log("No submission ID found in data:", data);
      return new Response(
        JSON.stringify({
          error: "Invalid webhook data - missing submission ID",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let status = "UNKNOWN";
    let shouldNotify = false;

    switch (event_type) {
      case "submission.created":
        status = "ENVIADO_PARA_ASSINATURA";
        break;
      case "form.completed":
        status = "ASSINADO";
        shouldNotify = true;
        break;
      case "submission.expired":
        status = "EXPIRADO";
        shouldNotify = true;
        break;
      case "form.declined":
        status = "RECUSADO";
        shouldNotify = true;
        break;
      default:
        console.log("Unhandled event type:", event_type);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const submissionId = data.submission.id.toString();
    console.log("Processing submission ID:", submissionId);

    // Find and update document
    const { data: documents, error: findError } = await supabaseClient
      .from("documentos_digitais")
      .select("*")
      .eq("docuseal_submission_id", submissionId);

    if (findError) {
      console.error("Error finding document:", findError);
      return new Response(
        JSON.stringify({ error: "Failed to find document" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!documents || documents.length === 0) {
      console.log("No document found for submission ID:", submissionId);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const document = documents[0];
    console.log("Document found:", document.id, "Updating to status:", status);

    // Update document status
    const { error: updateError } = await supabaseClient
      .from("documentos_digitais")
      .update({
        status,
        webhook_data: webhookData,
        updated_at: new Date().toISOString(),
        ...(status === "ASSINADO" && {
          data_conclusao: new Date().toISOString(),
        }),
      })
      .eq("id", document.id);

    if (updateError) {
      console.error("Error updating document:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update document" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create notification if needed
    if (shouldNotify) {
      const notificationTitle =
        status === "ASSINADO"
          ? "Documento Assinado"
          : status === "EXPIRADO"
          ? "Documento Expirado"
          : "Documento Recusado";

      const notificationMessage =
        status === "ASSINADO"
          ? `O documento "${document.nome}" foi assinado com sucesso.`
          : status === "EXPIRADO"
          ? `O documento "${document.nome}" expirou sem ser assinado.`
          : `O documento "${document.nome}" foi recusado.`;

      const { error: notificationError } = await supabaseClient
        .from("notificacoes")
        .insert({
          user_id: document.user_id,
          tipo: "DOCUMENTO_DIGITAL",
          titulo: notificationTitle,
          mensagem: notificationMessage,
          data_documento: document.id,
          lida: false,
          created_at: new Date().toISOString(),
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      } else {
        console.log("Notification created successfully");
      }
    }

    console.log("Webhook processed successfully!");
    return new Response(
      JSON.stringify({
        success: true,
        document_updated: document.id,
        new_status: status,
        notification_created: shouldNotify,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
