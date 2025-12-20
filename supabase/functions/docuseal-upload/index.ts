/// <reference lib="dom" />
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const responseWithCors = (
  body: Record<string, unknown> | string,
  status = 200,
  additionalHeaders: Record<string, string> = {}
) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...additionalHeaders,
    },
  });
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface DocuSealField {
  name: string;
  type: "signature" | "text" | "date" | "checkbox" | "initial";
  required?: boolean;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

// Adicione esta função para extrair o número de páginas do PDF
async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Verifica se é um PDF (magic number %PDF)
    if (
      uint8Array[0] === 0x25 &&
      uint8Array[1] === 0x50 &&
      uint8Array[2] === 0x44 &&
      uint8Array[3] === 0x46
    ) {
      const text = new TextDecoder().decode(uint8Array.slice(0, 1000)); // Lê apenas os primeiros bytes

      // Procura por "/Count" que indica o número de páginas em alguns PDFs
      const countMatch = text.match(/\/Count\s+(\d+)/);
      if (countMatch) {
        return parseInt(countMatch[1]);
      }

      // Procura por "/Type\s*\/Pages" que pode indicar a estrutura de páginas
      const pagesMatch = text.match(/\/Type\s*\/Pages/);
      if (pagesMatch) {
        // Se não encontrou Count, assume pelo menos 1 página
        return 1;
      }
    }

    // Fallback: conta ocorrências de "endobj" que geralmente indicam objetos de página
    const fullText = new TextDecoder().decode(uint8Array);
    const pageObjectMatches = fullText.match(/\/Type\s*\/Page\b/g);
    if (pageObjectMatches) {
      return pageObjectMatches.length;
    }

    // Último fallback: conta "endobj" dividido por um fator empírico
    const endobjMatches = fullText.match(/endobj\b/g);
    if (endobjMatches && endobjMatches.length > 10) {
      return Math.max(1, Math.floor(endobjMatches.length / 10));
    }

    return 1; // Fallback final
  } catch (error) {
    console.error("Erro ao contar páginas do PDF:", error);
    return 1; // Fallback em caso de erro
  }
}

serve(async (req) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  const url = new URL(req.url);
  console.log("URL pathname:", url.pathname);

  const docusealApiKey = Deno.env.get("DOCUSEAL_API_KEY");
  const docusealBaseUrl = Deno.env.get("DOCUSEAL_BASE_URL");
  if (!docusealApiKey || !docusealBaseUrl) {
    console.error(
      "DOCUSEAL_API_KEY or DOCUSEAL_BASE_URL environment variables not configured"
    );
    return responseWithCors({ error: "Server configuration incomplete" }, 500);
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    }
  );

  // Authentication
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();
  if (!user || authError) {
    console.log("Authentication error:", authError?.message);
    return responseWithCors({ error: "Unauthorized" }, 401);
  }

  // Upload route
  const routePath = url.pathname.replace("/functions/v1", "");
  if (req.method === "POST" && routePath === "/docuseal-upload") {
    try {
      console.log("Iniciando upload para DocuSeal");
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const file = formData.get("file");
        const title = formData.get("title") as string | null;
        const documentId = formData.get("documentId") as string | null;
        const fieldsJson = formData.get("fields") as string | null;

        // Parse dos campos se fornecidos
        let fields: DocuSealField[] = [];
        if (fieldsJson) {
          try {
            fields = JSON.parse(fieldsJson);
            console.log("Campos parseados:", fields);
          } catch (e) {
            console.error("Erro ao parsear campos:", e);
            return responseWithCors({ error: "Invalid fields format" }, 400);
          }
        }

        if (!(file instanceof Blob)) {
          return responseWithCors({ error: "Invalid file type" }, 400);
        }

        if (!documentId) {
          return responseWithCors({ error: "Document ID is required" }, 400);
        }

        const uploadFile =
          file instanceof File
            ? file
            : new File([file], "document.pdf", { type: file.type });

        // Preparar dados para upload - FORMATO CORRETO PARA DOCUSEAL
        const uploadData: any = {
          name: title || "Documento sem título",
          documents: [
            {
              name: uploadFile.name,
              file: await fileToBase64(uploadFile),
            },
          ],
        };

        // Substitua a parte do processamento de campos por:
        if (fields.length > 0) {
          const totalPages = await getPdfPageCount(uploadFile);
          console.log(`PDF tem ${totalPages} página(s)`);

          uploadData.documents[0].fields = [];

          // Mapear tipos de campo para roles
          const fieldRoleMapping: Record<string, string> = {
            rubrica_contratante: "First Party",
            assinatura_contratante: "First Party",
            data_contratante: "First Party",
            rubrica_contratado: "Segunda Parte",
            assinatura_contratado: "Segunda Parte",
            data_contratado: "Segunda Parte",
          };

          for (const field of fields) {
            // Mapear "initial" para "initials" (que é o tipo correto do DocuSeal)
            let fieldType = field.type;
            if (fieldType === "initial") {
              fieldType = "initials";
            }

            // Obter a role do mapeamento
            const role = fieldRoleMapping[field.name] || "First Party"; // ← CORREÇÃO AQUI

            if (fieldType === "initials") {
              // Rubricas em todas as páginas
              for (let i = 1; i <= totalPages; i++) {
                uploadData.documents[0].fields.push({
                  name: `${field.name}_page_${i}`,
                  type: fieldType, // Agora será "initials"
                  required: field.required || false,
                  role: role, // ← USANDO A VARIÁVEL role DEFINIDA
                  areas: [
                    {
                      page: i,
                      x: field.x / 595,
                      y: field.y / 842,
                      w: (field.width || 100) / 595,
                      h: (field.height || 50) / 842,
                    },
                  ],
                });
              }
            } else {
              // Outros campos na página especificada ou última página
              const targetPage =
                field.page && field.page > 0
                  ? Math.min(field.page, totalPages)
                  : totalPages;

              uploadData.documents[0].fields.push({
                name: field.name,
                type: fieldType,
                required: field.required || false,
                role: role, // ← USANDO A VARIÁVEL role DEFINIDA
                areas: [
                  {
                    page: targetPage,
                    x: field.x / 595,
                    y: field.y / 842,
                    w: (field.width || 200) / 595,
                    h: (field.height || 80) / 842,
                  },
                ],
              });
            }
          }

          console.log(
            "Campos formatados para API:",
            uploadData.documents[0].fields
          );
        }

        console.log(
          "Dados enviados para DocuSeal:",
          JSON.stringify(uploadData, null, 2)
        );

        // 1. Upload para o DocuSeal - ENDPOINT CORRETO
        const uploadResponse = await fetch(`${docusealBaseUrl}/templates/pdf`, {
          method: "POST",
          headers: {
            "X-Auth-Token": docusealApiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(uploadData),
        });

        const responseText = await uploadResponse.text();
        console.log("Resposta bruta do DocuSeal:", responseText);

        if (!uploadResponse.ok) {
          console.error("DocuSeal error response:", responseText);
          let errorDetails;
          try {
            errorDetails = JSON.parse(responseText);
          } catch {
            errorDetails = responseText;
          }

          return responseWithCors(
            {
              error: "Failed to upload to DocuSeal",
              details: errorDetails,
              status: uploadResponse.status,
            },
            uploadResponse.status
          );
        }

        let docusealData;
        try {
          docusealData = JSON.parse(responseText);
          console.log("Resposta parseada do DocuSeal:", docusealData);
        } catch (e) {
          console.error("Erro ao parsear resposta do DocuSeal:", e);
          return responseWithCors(
            { error: "Invalid response from DocuSeal" },
            502
          );
        }

        // 2. Atualizar o documento no Supabase
        const { data: document, error: dbError } = await supabaseClient
          .from("documentos_digitais")
          .update({
            docuseal_template_id: docusealData.id
              ? docusealData.id.toString()
              : null,
            status: docusealData.id ? "TEMPLATE_CRIADO" : "ERRO",
            updated_at: new Date().toISOString(),
            metadata: {
              docuseal_response: docusealData,
              campos_definidos: fields.length > 0,
              campos: fields,
              upload_timestamp: new Date().toISOString(),
            },
          })
          .eq("id", documentId)
          .select()
          .single();

        if (dbError) {
          console.error("Supabase update error:", dbError);
          return responseWithCors(
            { error: "Database error", details: dbError.message },
            500
          );
        }

        return responseWithCors({
          success: true,
          document,
          docuseal_data: docusealData,
          campos_adicionados: fields.length > 0,
        });
      } else {
        return responseWithCors({ error: "Invalid content type" }, 400);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Detailed error:", errorMessage);
      console.error(
        "Stack:",
        error instanceof Error ? error.stack : "No stack"
      );
      return responseWithCors(
        {
          error: "Internal server error",
          details: errorMessage,
        },
        500
      );
    }
  }

  return responseWithCors({ error: "Not Found" }, 404);
});
