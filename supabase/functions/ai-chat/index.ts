import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Resposta de fallback quando a OpenAI não funciona
const getFallbackResponse = (message: string, context: string) => {
  return `⚠️ **Sistema em modo de fallback** ⚠️

Sua consulta: "${message}"

Contexto: ${context || 'Direito brasileiro'}

📝 **Nota importante:** 
No momento, nosso sistema de IA principal está temporariamente indisponível devido a limitações de cota. 

🔧 **Soluções alternativas:**
1. Verifique documentação jurídica online
2. Consulte bases de dados como JusBrasil, TJSP, STJ
3. Revise a legislação aplicável

💡 **Dica:** Para questões específicas, recomendo consultar:
- Código Civil Brasileiro
- Código de Processo Civil  
- Jurisprudência dos tribunais
- Doutrinas especializadas

📞 **Suporte técnico:** Entre em contato com o administrador do sistema para verificar a configuração da API.`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { message, context } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensagem é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se não tem chave da OpenAI, usa fallback imediatamente
    if (!openAIApiKey) {
      console.log('Usando fallback - OPENAI_API_KEY não configurada');
      const fallbackResponse = getFallbackResponse(message, context);
      return new Response(
        JSON.stringify({ response: fallbackResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Tentando conectar com OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Você é um assistente jurídico especializado em direito brasileiro. Contexto: ${context || 'Nenhum contexto específico'}` 
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.warn('OpenAI falhou, usando fallback');
      const fallbackResponse = getFallbackResponse(message, context);
      return new Response(
        JSON.stringify({ response: fallbackResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na função ai-chat, usando fallback:', error);
    
    const { message, context } = await req.json().catch(() => ({ message: '', context: '' }));
    const fallbackResponse = getFallbackResponse(message, context);
    
    return new Response(
      JSON.stringify({ response: fallbackResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
