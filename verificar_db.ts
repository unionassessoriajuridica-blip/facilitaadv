import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Pega as chaves do seu arquivo .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas. Verifique o .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verificar() {
  console.log("🔍 Consultando últimas observações no Banco de Dados...");
  
  // Busca as 5 últimas na tabela correta
  const { data: observacoes, error } = await supabase
    .from('observacoes_processo')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("❌ Erro ao conectar no banco:", error.message);
    return;
  }

  if (!observacoes || observacoes.length === 0) {
    console.log("❌ Nenhuma observação encontrada.");
  } else {
    console.log(`✅ Encontradas ${observacoes.length} observações recentes:\n`);
    observacoes.forEach((obs, index) => {
      console.log(`📌 REGISTRO #${index + 1}`);
      console.log(`📅 Data: ${new Date(obs.created_at).toLocaleString('pt-BR')}`);
      console.log(`👤 Cliente: ${obs.cliente_nome}`);
      console.log(`📝 Título: ${obs.titulo}`);
      console.log(`📄 Conteúdo (Resumo): ${obs.conteudo?.substring(0, 100)}...`);
      console.log("-------------------------------------------------------");
    });
  }
}

verificar();
