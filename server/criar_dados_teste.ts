// server/criar_dados_teste.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Erro: Variáveis de ambiente não encontradas no .env");
    process.exit(1);
}

// Inicializa com permissões de ADMIN para criar usuários no Auth
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function criarDadosTeste() {
    console.log("🛠️  Iniciando criação de dados de teste (Via Supabase Auth)...");

    // =================================================================
    // CONFIGURAÇÃO DOS DADOS DE TESTE
    // =================================================================
    const telefoneTeste = "244946120705"; 
    const nomeCliente = "Edgar Catraio";
    const numeroProcessoTeste = "0000062-00.2026.8.26.0000";
    const emailAdmin = "admin@teste.com";
    // =================================================================

    let userId: string;

    // 1. Tentar criar ou buscar o usuário no sistema de Autenticação (auth.users)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        console.error("❌ Erro ao listar usuários:", listError.message);
        return;
    }

    const usuarioExistente = users.find(u => u.email === emailAdmin);

    if (usuarioExistente) {
        userId = usuarioExistente.id;
        console.log(`👤 Usuário Auth encontrado: ${emailAdmin} (ID: ${userId})`);
    } else {
        console.log(`⚠️ Usuário não encontrado. Criando novo usuário Auth...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: emailAdmin,
            password: "senha_teste_123", // Senha temporária
            email_confirm: true
        });

        if (createError || !newUser.user) {
            console.error("❌ Erro ao criar usuário Auth:", createError?.message);
            return;
        }
        userId = newUser.user.id;
        console.log(`✅ Usuário Auth criado: ${emailAdmin} (ID: ${userId})`);
    }

    // 2. Criar um Cliente de Teste vinculado a esse usuário (UUID)
    const { data: clientesBusca } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('telefone', telefoneTeste)
        .limit(1);
    
    let clienteId: string;

    if (clientesBusca && clientesBusca.length > 0) {
        clienteId = clientesBusca[0].id;
        console.log(`✅ Cliente já existe: ${clientesBusca[0].nome} (ID: ${clienteId})`);
    } else {
        const { data: cliente, error: clientError } = await supabase
            .from('clientes')
            .insert({
                user_id: userId, // Usa o UUID do Auth
                nome: nomeCliente,
                telefone: telefoneTeste,
                email: "edgar.catraio@teste.com"
            })
            .select()
            .single();

        if (clientError) {
            console.error("❌ Erro ao criar cliente:", clientError.message);
            return;
        }
        clienteId = cliente.id;
        console.log(`✅ Cliente criado: ${cliente.nome} (Tel: ${cliente.telefone})`);
    }

    // 3. Criar Processo vinculado
    // Verifica se processo já existe
    const { data: processosBusca } = await supabase
        .from('processos')
        .select('id')
        .eq('numero_processo', numeroProcessoTeste)
        .limit(1);

    if (processosBusca && processosBusca.length > 0) {
        console.log(`⚠️ O processo ${numeroProcessoTeste} já existe.`);
        // Atualiza para garantir que está vinculado ao cliente Edgar
        await supabase
            .from('processos')
            .update({ cliente_id: clienteId, status: 'ATIVO' })
            .eq('id', processosBusca[0].id);
        console.log(`🔄 Processo atualizado para vincular a ${nomeCliente}.`);

    } else {
        const { data: processo, error: procError } = await supabase
            .from('processos')
            .insert({
                user_id: userId,
                cliente_id: clienteId,
                numero_processo: numeroProcessoTeste,
                tipo_processo: "Civil",
                status: "ATIVO",
                movimentacoes: "Aguardando primeira movimentação..."
            })
            .select()
            .single();

        if (procError) {
            console.error("❌ Erro ao criar processo:", procError.message);
            return;
        }
        console.log(`✅ Processo criado: ${processo.numero_processo}`);
    }

    console.log("---------------------------------------------------");
    console.log("🚀 TUDO PRONTO!");
    console.log(`Cliente: ${nomeCliente} (${telefoneTeste})`);
    console.log(`Processo: ${numeroProcessoTeste}`);
    console.log("Agora rode o script: npx tsx server/testar_robo.ts");
    console.log("---------------------------------------------------");
}

criarDadosTeste();