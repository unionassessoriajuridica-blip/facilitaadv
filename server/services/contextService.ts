import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NUMERO_RAFAEL = '5516993508206';

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');

/**
 * Função usada pela IA para buscar dados específicos durante a conversa
 */
export async function realizarBuscaAtivaParaIA(termo: string) {
  try {
    const termoLimpo = termo.replace(/\D/g, '');
    
    // Busca por Processo
    const { data: proc } = await supabase
      .from('processos')
      .select('*, clientes(nome, telefone)')
      .ilike('numero_processo', `%${termo}%`)
      .limit(1)
      .single();

    if (proc) return { tipo: 'processo', dados: proc };

    // Busca por CPF
    const { data: cli } = await supabase
      .from('clientes')
      .select('*, processos(*)')
      .eq('cpf_cnpj', termoLimpo)
      .limit(1)
      .single();

    if (cli) return { tipo: 'cliente', dados: cli };

    return { erro: "Nenhum dado encontrado para este termo." };
  } catch (error) {
    return { erro: "Erro na consulta ao banco." };
  }
}

export async function getContextoCliente(telefone: string, mensagemOriginal?: string) {
  try {
    const formattedPhone = telefone.replace(/\D/g, '');
    
    // 1) LÓGICA DE SUPER USUÁRIO (DR. RAFAEL)
    if (formattedPhone === NUMERO_RAFAEL) {
      console.log("[ContextService] Acesso Master detectado: Dr. Rafael");
      const { data: processos } = await supabase.from('processos').select('*, clientes(nome)').limit(20);
      const { data: financeiro } = await supabase.from('financeiro').select('*').eq('status', 'PENDENTE').limit(10);
      
      return { 
        isMaster: true, 
        cliente: { nome: "Dr. Rafael" }, 
        processos: processos || [], 
        financeiro: financeiro || [] 
      };
    }

    // 2) LÓGICA DE BUSCA AVANÇADA (CPF ou Processo na mensagem)
    if (mensagemOriginal) {
      const regexCpf = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/;
      const regexProcesso = /\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}/;

      const cpfEncontrado = mensagemOriginal.match(regexCpf);
      const processoEncontrado = mensagemOriginal.match(regexProcesso);

      if (processoEncontrado) {
        const { data: proc } = await supabase
          .from('processos')
          .select('*, clientes(*)')
          .ilike('numero_processo', `%${processoEncontrado[0]}%`)
          .single();
        if (proc) return { cliente: proc.clientes, processos: [proc] };
      }

      if (cpfEncontrado) {
        const { data: cli } = await supabase
          .from('clientes')
          .select('*, processos(*)')
          .eq('cpf_cnpj', cpfEncontrado[0].replace(/\D/g, ''))
          .single();
        if (cli) return { cliente: cli, processos: cli.processos || [] };
      }
    }

    // 3) BUSCA PADRÃO POR TELEFONE
    const { data: clientes } = await supabase
      .from('clientes')
      .select('*')
      .ilike('telefone', `%${formattedPhone}%`)
      .limit(1);

    const cliente = clientes?.[0];
    if (!cliente) return { cliente: null, processos: [] };

    const { data: processos } = await supabase
      .from('processos')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    return { cliente, processos: processos || [] };
  } catch (error) {
    console.error('[ContextService] Erro:', error);
    return { cliente: null, procesos: [] };
  }
}

export async function getContextoCompletoPorTelefone(telefone: string) {
  try {
    const formattedPhone = telefone.replace(/\D/g, '');

    // 1. Busca o Cliente
    const { data: clientes, error: cliError } = await supabase
      .from('clientes')
      .select('*')
      .ilike('telefone', `%${formattedPhone}%`)
      .limit(1);

    if (cliError || !clientes[0]) return { cliente: null, processos: [], financeiro: [] };
    const cliente = clientes[0];

    // 2. Busca TODOS os Processos e Movimentações (sem o limite de 5)
    const { data: processos } = await supabase
      .from('processos')
      .select('numero_processo, status, movimentacoes, updated_at, tipo_processo')
      .eq('cliente_id', cliente.id)
      .order('updated_at', { ascending: false });

    // 3. Busca Dados Financeiros (Honorários e Cobranças)
    const { data: financeiro } = await supabase
      .from('financeiro')
      .select('*')
      .eq('cliente_nome', cliente.nome)
      .order('vencimento', { ascending: true });

    return {
      cliente,
      processos: processos || [],
      financeiro: financeiro || []
    };
  } catch (error) {
    console.error('[ContextService] Erro na busca completa:', error);
    return { cliente: null, processos: [], financeiro: [] };
  }
}