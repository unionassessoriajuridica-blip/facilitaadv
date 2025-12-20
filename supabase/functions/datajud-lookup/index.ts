declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const tribunalMap: Record<string, string> = {
  '1.00': 'api_publica_stf',
  '2.00': 'api_publica_cnj',
  '3.00': 'api_publica_stj',
  '9.00': 'api_publica_stm',
  '0.90': 'api_publica_tst',
  '0.00': 'api_publica_tse',
  '4.01': 'api_publica_trf1',
  '4.02': 'api_publica_trf2',
  '4.03': 'api_publica_trf3',
  '4.04': 'api_publica_trf4',
  '4.05': 'api_publica_trf5',
  '4.06': 'api_publica_trf6',
  '5.01': 'api_publica_trt1',
  '5.02': 'api_publica_trt2',
  '5.03': 'api_publica_trt3',
  '5.04': 'api_publica_trt4',
  '5.05': 'api_publica_trt5',
  '5.06': 'api_publica_trt6',
  '5.07': 'api_publica_trt7',
  '5.08': 'api_publica_trt8',
  '5.09': 'api_publica_trt9',
  '5.10': 'api_publica_trt10',
  '5.11': 'api_publica_trt11',
  '5.12': 'api_publica_trt12',
  '5.13': 'api_publica_trt13',
  '5.14': 'api_publica_trt14',
  '5.15': 'api_publica_trt15',
  '5.16': 'api_publica_trt16',
  '5.17': 'api_publica_trt17',
  '5.18': 'api_publica_trt18',
  '5.19': 'api_publica_trt19',
  '5.20': 'api_publica_trt20',
  '5.21': 'api_publica_trt21',
  '5.22': 'api_publica_trt22',
  '5.23': 'api_publica_trt23',
  '5.24': 'api_publica_trt24',
  '6.01': 'api_publica_tre-ac',
  '6.02': 'api_publica_tre-al',
  '6.03': 'api_publica_tre-ap',
  '6.04': 'api_publica_tre-am',
  '6.05': 'api_publica_tre-ba',
  '6.06': 'api_publica_tre-ce',
  '6.07': 'api_publica_tre-df',
  '6.08': 'api_publica_tre-es',
  '6.09': 'api_publica_tre-go',
  '6.10': 'api_publica_tre-ma',
  '6.11': 'api_publica_tre-mt',
  '6.12': 'api_publica_tre-ms',
  '6.13': 'api_publica_tre-mg',
  '6.14': 'api_publica_tre-pa',
  '6.15': 'api_publica_tre-pb',
  '6.16': 'api_publica_tre-pr',
  '6.17': 'api_publica_tre-pe',
  '6.18': 'api_publica_tre-pi',
  '6.19': 'api_publica_tre-rj',
  '6.20': 'api_publica_tre-rn',
  '6.21': 'api_publica_tre-rs',
  '6.22': 'api_publica_tre-ro',
  '6.23': 'api_publica_tre-rr',
  '6.24': 'api_publica_tre-sc',
  '6.25': 'api_publica_tre-sp',
  '6.26': 'api_publica_tre-se',
  '6.27': 'api_publica_tre-to',
  '8.01': 'api_publica_tjac',
  '8.02': 'api_publica_tjal',
  '8.03': 'api_publica_tjap',
  '8.04': 'api_publica_tjam',
  '8.05': 'api_publica_tjba',
  '8.06': 'api_publica_tjce',
  '8.07': 'api_publica_tjdft',
  '8.08': 'api_publica_tjes',
  '8.09': 'api_publica_tjgo',
  '8.10': 'api_publica_tjma',
  '8.11': 'api_publica_tjmt',
  '8.12': 'api_publica_tjms',
  '8.13': 'api_publica_tjmg',
  '8.14': 'api_publica_tjpa',
  '8.15': 'api_publica_tjpb',
  '8.16': 'api_publica_tjpr',
  '8.17': 'api_publica_tjpe',
  '8.18': 'api_publica_tjpi',
  '8.19': 'api_publica_tjrj',
  '8.20': 'api_publica_tjrn',
  '8.21': 'api_publica_tjrs',
  '8.22': 'api_publica_tjro',
  '8.23': 'api_publica_tjrr',
  '8.24': 'api_publica_tjsc',
  '8.25': 'api_publica_tjse',
  '8.26': 'api_publica_tjsp',
  '8.27': 'api_publica_tjto',
  '9.13': 'api_publica_tjmmg',
  '9.21': 'api_publica_tjmrs',
  '9.26': 'api_publica_tjmsp',
};

function extractTribunalCode(processNumber: string): string {
  const cleanNumber = processNumber.replace(/\D/g, '');
  if (cleanNumber.length >= 20) {
    const segmento = cleanNumber.substring(13, 14);
    const tribunal = cleanNumber.substring(14, 16);
    return `${segmento}.${tribunal}`;
  }
  return '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { action, processNumber, processoId } = await req.json()

    if (action === 'lookup') {
      if (!processNumber) {
        return new Response(JSON.stringify({ error: 'Número do processo é obrigatório.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const tribunalCode = extractTribunalCode(processNumber);
      
      if (!tribunalCode) {
        return new Response(JSON.stringify({ 
          error: 'Não foi possível identificar o tribunal pelo número do processo.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const endpoint = tribunalMap[tribunalCode];

      if (!endpoint) {
        return new Response(JSON.stringify({ 
          error: `Tribunal não mapeado (Código CNJ: ${tribunalCode}). Verifique o número do processo.` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      const apiKey = Deno.env.get('DATAJUD_API_KEY');
      if (!apiKey) {
        return new Response(JSON.stringify({ 
          error: 'API Key do DataJud não configurada no servidor.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }

      const url = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;
      const cleanProcessNumber = processNumber.replace(/\D/g, '');
      
      console.log(`DataJud: Consultando ${endpoint} para processo ${cleanProcessNumber}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `APIKey ${apiKey}`
        },
        body: JSON.stringify({
          query: {
            term: {
              numeroProcesso: cleanProcessNumber
            }
          },
          _source: true
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Erro DataJud API:", response.status, errText);
        throw new Error(`Erro na API DataJud (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const hits = data?.hits?.hits;
      
      if (!hits || hits.length === 0) {
        if (processoId) {
          const { data: processoData, error: processoError } = await supabase
            .from('processos')
            .select('id, user_id')
            .eq('id', processoId)
            .single();

          if (!processoError && processoData) {
            const { data: userRole } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .single();

            const { data: userPermissions } = await supabase
              .from('user_permissions')
              .select('permission')
              .eq('user_id', user.id);

            const hasGlobalAccess = 
              userRole?.role === 'master' || 
              userRole?.role === 'admin' ||
              userPermissions?.some((p: any) => p.permission === 'ver_todos_processos');

            const isOwner = processoData.user_id === user.id;

            if (hasGlobalAccess || isOwner) {
              await supabase
                .from('processos')
                .update({
                  datajud_sigilo: true,
                  datajud_atualizado_em: new Date().toISOString()
                })
                .eq('id', processoId);
            }
          }
        }

        return new Response(JSON.stringify({ 
          sigilo: true,
          message: "Processo sob sigilo. Dados não disponíveis na base pública do DataJud." 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      const processData = hits[0]._source;

      if (processoId) {
        const { data: processoData, error: processoError } = await supabase
          .from('processos')
          .select('id, user_id')
          .eq('id', processoId)
          .single();

        if (processoError || !processoData) {
          return new Response(JSON.stringify({ 
            error: 'Processo não encontrado.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          });
        }

        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        const { data: userPermissions } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', user.id);

        const hasGlobalAccess = 
          userRole?.role === 'master' || 
          userRole?.role === 'admin' ||
          userPermissions?.some((p: any) => p.permission === 'ver_todos_processos');

        const isOwner = processoData.user_id === user.id;

        if (!hasGlobalAccess && !isOwner) {
          return new Response(JSON.stringify({ 
            error: 'Você não tem permissão para atualizar este processo.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403
          });
        }

        const movimentos = processData.movimentos || [];
        const sortedMovimentos = movimentos.sort((a: any, b: any) => {
          return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime();
        });

        const ultimaMovimentacao = sortedMovimentos.length > 0 
          ? sortedMovimentos[0].dataHora 
          : null;

        const { error: updateError } = await supabase
          .from('processos')
          .update({
            datajud_tribunal: processData.tribunal || null,
            datajud_classe: processData.classe?.nome || null,
            datajud_classe_codigo: processData.classe?.codigo || null,
            datajud_sistema: processData.sistema?.nome || null,
            datajud_formato: processData.formato?.nome || null,
            datajud_grau: processData.grau || null,
            datajud_data_ajuizamento: processData.dataAjuizamento || null,
            datajud_movimentos: JSON.stringify(sortedMovimentos),
            datajud_ultima_atualizacao_cnj: processData.dataHoraUltimaAtualizacao || null,
            datajud_ultima_movimentacao: ultimaMovimentacao,
            datajud_atualizado_em: new Date().toISOString(),
          })
          .eq('id', processoId);

        if (updateError) {
          console.error("Erro ao salvar dados:", updateError);
          return new Response(JSON.stringify({ 
            error: "Erro ao salvar dados do processo." 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        tribunal: processData.tribunal,
        classe: processData.classe?.nome,
        sistema: processData.sistema?.nome,
        formato: processData.formato?.nome,
        grau: processData.grau,
        dataAjuizamento: processData.dataAjuizamento,
        dataHoraUltimaAtualizacao: processData.dataHoraUltimaAtualizacao,
        movimentos: (processData.movimentos || []).sort((a: any, b: any) => {
          return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime();
        }),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
