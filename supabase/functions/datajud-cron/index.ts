import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DATAJUD_API_KEY = Deno.env.get("DATAJUD_API_KEY")!;

const TRIBUNAIS: Record<string, string> = {
  "8.06": "api_publica_tjce",
  "8.26": "api_publica_tjsp",
  "8.19": "api_publica_tjrj",
  "8.13": "api_publica_tjmg",
  "8.21": "api_publica_tjrs",
  "8.16": "api_publica_tjpr",
  "8.24": "api_publica_tjsc",
  "8.05": "api_publica_tjba",
  "8.08": "api_publica_tjdf",
  "8.09": "api_publica_tjes",
  "8.03": "api_publica_tjms",
  "8.11": "api_publica_tjmt",
  "8.27": "api_publica_tjto",
  "8.12": "api_publica_tjrn",
  "8.15": "api_publica_tjpb",
  "8.17": "api_publica_tjpe",
  "8.02": "api_publica_tjal",
  "8.25": "api_publica_tjse",
  "8.22": "api_publica_tjro",
  "8.01": "api_publica_tjac",
  "8.04": "api_publica_tjam",
  "8.14": "api_publica_tjpa",
  "8.18": "api_publica_tjpi",
  "8.07": "api_publica_tjce",
  "8.20": "api_publica_tjrr",
  "8.23": "api_publica_tjap",
  "8.10": "api_publica_tjgo",
  "8.28": "api_publica_tjma",
  "4.01": "api_publica_trf1",
  "4.02": "api_publica_trf2",
  "4.03": "api_publica_trf3",
  "4.04": "api_publica_trf4",
  "4.05": "api_publica_trf5",
  "4.06": "api_publica_trf6",
  "5.01": "api_publica_trt1",
  "5.02": "api_publica_trt2",
  "5.03": "api_publica_trt3",
  "5.04": "api_publica_trt4",
  "5.05": "api_publica_trt5",
  "5.06": "api_publica_trt6",
  "5.07": "api_publica_trt7",
  "5.08": "api_publica_trt8",
  "5.09": "api_publica_trt9",
  "5.10": "api_publica_trt10",
  "5.11": "api_publica_trt11",
  "5.12": "api_publica_trt12",
  "5.13": "api_publica_trt13",
  "5.14": "api_publica_trt14",
  "5.15": "api_publica_trt15",
  "5.16": "api_publica_trt16",
  "5.17": "api_publica_trt17",
  "5.18": "api_publica_trt18",
  "5.19": "api_publica_trt19",
  "5.20": "api_publica_trt20",
  "5.21": "api_publica_trt21",
  "5.22": "api_publica_trt22",
  "5.23": "api_publica_trt23",
  "5.24": "api_publica_trt24",
};

function extractTribunalCode(processNumber: string): string | null {
  const cleanNumber = processNumber.replace(/\D/g, "");
  if (cleanNumber.length >= 20) {
    const segmento = cleanNumber.substring(13, 14);
    const tribunal = cleanNumber.substring(14, 16);
    return `${segmento}.${tribunal}`;
  }
  return null;
}

function getTribunalEndpoint(tribunalCode: string): string | null {
  return TRIBUNAIS[tribunalCode] || null;
}

async function lookupDatajud(processNumber: string): Promise<any> {
  const tribunalCode = extractTribunalCode(processNumber);
  if (!tribunalCode) {
    return { success: false, error: "Não foi possível extrair o código do tribunal" };
  }

  const endpoint = getTribunalEndpoint(tribunalCode);
  if (!endpoint) {
    return { success: false, error: `Tribunal não suportado: ${tribunalCode}` };
  }

  const cleanNumber = processNumber.replace(/\D/g, "");
  const url = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${DATAJUD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          match: {
            numeroProcesso: cleanNumber,
          },
        },
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Erro na API DataJud: ${response.status}` };
    }

    const data = await response.json();
    const hits = data.hits?.hits || [];

    if (hits.length === 0) {
      return { success: true, sigilo: true };
    }

    const source = hits[0]._source;
    return {
      success: true,
      sigilo: false,
      tribunal: source.tribunal,
      classe: source.classe?.nome,
      classeCodigo: source.classe?.codigo,
      sistema: source.sistema?.nome,
      formato: source.formato?.nome,
      grau: source.grau,
      dataAjuizamento: source.dataAjuizamento,
      dataHoraUltimaAtualizacao: source.dataHoraUltimaAtualizacao,
      movimentos: source.movimentos || [],
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("DataJud Cron iniciado...");
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: processos, error: fetchError } = await supabase
      .from("processos")
      .select("id, numero_processo")
      .not("numero_processo", "is", null)
      .neq("numero_processo", "")
      .order("datajud_atualizado_em", { ascending: true, nullsFirst: true })
      .limit(50);

    if (fetchError) {
      console.error("Erro ao buscar processos:", fetchError);
      throw new Error(`Erro ao buscar processos: ${fetchError.message}`);
    }

    console.log(`Encontrados ${processos?.length || 0} processos para atualizar`);

    const results = {
      total: processos?.length || 0,
      success: 0,
      sigilo: 0,
      errors: 0,
      details: [] as any[],
    };

    let processedCount = 0;
    for (const processo of processos || []) {
      try {
        console.log(`[${processedCount + 1}/${processos?.length}] Processando: ${processo.numero_processo}`);
        
        const result = await lookupDatajud(processo.numero_processo);
        console.log(`[${processedCount + 1}] Resultado: ${result.success ? 'OK' : result.sigilo ? 'SIGILO' : 'ERRO'}`);

        if (result.sigilo) {
          const { error: updateError } = await supabase
            .from("processos")
            .update({
              datajud_sigilo: true,
              datajud_atualizado_em: new Date().toISOString(),
            })
            .eq("id", processo.id);

          if (updateError) {
            results.errors++;
            results.details.push({ id: processo.id, error: updateError.message });
          } else {
            results.sigilo++;
          }
        } else if (result.success) {
          const updateData: any = {
            datajud_sigilo: false,
            datajud_tribunal: result.tribunal,
            datajud_classe: result.classe,
            datajud_classe_codigo: result.classeCodigo,
            datajud_sistema: result.sistema,
            datajud_formato: result.formato,
            datajud_grau: result.grau,
            datajud_data_ajuizamento: result.dataAjuizamento,
            datajud_ultima_atualizacao_cnj: result.dataHoraUltimaAtualizacao,
            datajud_atualizado_em: new Date().toISOString(),
          };

          if (result.movimentos && result.movimentos.length > 0) {
            updateData.datajud_movimentos = JSON.stringify(result.movimentos);
            updateData.datajud_ultima_movimentacao = result.movimentos[0]?.dataHora;
          }

          const { error: updateError } = await supabase
            .from("processos")
            .update(updateData)
            .eq("id", processo.id);

          if (updateError) {
            results.errors++;
            results.details.push({ id: processo.id, error: updateError.message });
          } else {
            results.success++;
          }
        } else {
          results.errors++;
          results.details.push({ id: processo.id, error: result.error });
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
        processedCount++;
      } catch (error) {
        console.error(`[${processedCount + 1}] ERRO: ${error.message}`);
        results.errors++;
        results.details.push({ id: processo.id, error: error.message });
        processedCount++;
      }
    }
    
    console.log(`Loop concluído. Total processados: ${processedCount}`);

    console.log(`Cron DataJud concluído: ${results.success} atualizados, ${results.sigilo} sigilosos, ${results.errors} erros`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no cron DataJud:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
