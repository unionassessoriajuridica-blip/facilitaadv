import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Credenciais do Supabase não encontradas.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// DADOS DE TESTE
const alvos = [
    {
        nome: "LAURA COSTA BORGES MENEZES RODRIGUES",
        telefone: "5516982594700",
        processo: "1506858-48.2025.8.26.0405"
    },
    {
        nome: "LOURIVAL ZOCAL FILHO",
        telefone: "5516991807390",
        processo: "1503252-59.2024.8.26.0530"
    },
    {
        nome: "SHAMIR MATHEUS DO NASCIMENTO",
        telefone: "5519995253042",
        processo: "0022149-53.2025.8.26.0506"
    },
    {
        nome: "MARLENE MARCIA RECHI GRAMINHA",
        telefone: "5516988430367",
        processo: "1036791-63.2015.8.26.0506"
    },
    {
        nome: "Edgar Catraio",
        telefone: "244946120705", // Angola
        processo: "0000062-00.2026.8.26.0000"
    }
];

// O TEXTO QUE SERÁ INSERIDO NO BANCO
const textoApresentacao = `
Olá! Eu sou a Inteligência Artificial do escritório FacilitA Advogados.

A partir de agora, vou monitorar seu processo 24h por dia. 
Sempre que houver uma novidade no tribunal, eu te mandarei um resumo simples e direto por aqui.

IMPORTANTE:
1. Se você recebeu esta mensagem, por favor, avise o Dr. Rafael para confirmarmos que o sistema está funcionando.
2. Salve este número na sua agenda para garantir que os links funcionem.

Estou à disposição para ajudar com atualizações automáticas! 
Data da inserção: ${new Date().toLocaleString('pt-BR')}
`.trim();

async function inserirMovimentacao() {
    console.log("SCRIPT 1: Inserindo movimentações no Banco de Dados...");

    for (const alvo of alvos) {
        console.log(`\n🔍 Alvo: ${alvo.nome} (${alvo.processo})`);

        // 1. Busca o processo para pegar o ID do cliente
        const { data: proc } = await supabase
            .from('processos')
            .select('id, cliente_id')
            .eq('numero_processo', alvo.processo)
            .maybeSingle();

        if (!proc) {
            console.log(`   ❌ Processo não encontrado! Pulei.`);
            continue;
        }

        // 2. Garante que o telefone está correto (para o teste funcionar)
        await supabase
            .from('clientes')
            .update({ telefone: alvo.telefone })
            .eq('id', proc.cliente_id);
            
        // 3. O PRINCIPAL: Atualiza a movimentação com o texto de apresentação
        const { error } = await supabase
            .from('processos')
            .update({ movimentacoes: textoApresentacao })
            .eq('id', proc.id);

        if (!error) {
            console.log(`   ✅ Movimentação atualizada no DB com sucesso.`);
        } else {
            console.error(`   ❌ Erro ao atualizar DB: ${error.message}`);
        }
    }
    console.log("\n🏁 SCRIPT 1 CONCLUÍDO. O banco já tem os textos. Agora rode o Script 2.");
}

inserirMovimentacao();
