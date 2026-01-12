import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
// Importamos a função de envio que criamos anteriormente
import { enviarTemplateWhatsApp } from './services/whatsappService';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

// LISTA DE PROCESSOS PARA O ROBÔ VERIFICAR
const processosParaLer = [
    "1506858-48.2025.8.26.0405",
    "1503252-59.2024.8.26.0530",
    "0022149-53.2025.8.26.0506",
    "1036791-63.2015.8.26.0506",
    "0000062-00.2026.8.26.0000"
];

async function dispararLeituraBanco() {
    console.log("🤖 SCRIPT 2: Robô lendo o banco e enviando mensagens...");

    for (const numeroProcesso of processosParaLer) {
        console.log(`\n---------------------------------------------------`);
        console.log(`📄 Lendo processo: ${numeroProcesso}`);

        // 1. Busca os dados no banco (Texto + Cliente)
        const { data: processo, error } = await supabase
            .from('processos')
            .select(`
                movimentacoes,
                clientes (
                    nome,
                    telefone
                )
            `)
            .eq('numero_processo', numeroProcesso)
            .maybeSingle();

        if (error || !processo) {
            console.log(`❌ Erro ou processo não encontrado.`);
            continue;
        }

        // @ts-ignore
        const cliente = processo.clientes;
        const textoParaEnviar = processo.movimentacoes; // Pega O QUE ESTÁ NO BANCO

        if (!cliente || !cliente.telefone) {
            console.log(`⚠️ Cliente sem telefone ou não vinculado.`);
            continue;
        }

        if (!textoParaEnviar) {
            console.log(`⚠️ Campo 'movimentacoes' está vazio.`);
            continue;
        }

        console.log(`👤 Cliente: ${cliente.nome}`);
        console.log(`📱 Telefone: ${cliente.telefone}`);
        console.log(`💬 Texto lido do DB: "${textoParaEnviar.substring(0, 50)}..."`);

        // 2. FORÇA O ENVIO DO TEMPLATE
        // Usa o modelo 'atualizacao_processual'
        // Variável 1: Nome
        // Variável 2: O Texto lido do banco
        
        try {
            const enviou = await enviarTemplateWhatsApp(
                cliente.telefone,
                "atualizacao_processual", // Nome do seu modelo no Meta
                [
                    cliente.nome,   // {{1}}
                    textoParaEnviar // {{2}}
                ]
            );

            if (enviou) {
                console.log(`✅ SUCESSO: Template enviado para ${cliente.telefone}`);
            } else {
                console.log(`❌ FALHA: A função de envio retornou erro (verifique token/modelo).`);
            }

        } catch (err) {
            console.error("❌ Erro fatal no envio:", err);
        }
    }
    console.log(`\n---------------------------------------------------`);
    console.log("🏁 FIM DO TESTE.");
}

dispararLeituraBanco();
