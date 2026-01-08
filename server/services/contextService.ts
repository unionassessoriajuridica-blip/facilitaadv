import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("[ContextService] Variáveis do Supabase não configuradas.");
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');

export async function getContextoCliente(telefone: string) {
  try {
    const formattedPhone = telefone.replace(/\D/g, '');

    // 1) Buscar cliente pelo telefone
    const { data: clientes, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .ilike('telefone', `%${formattedPhone}%`)
      .limit(1);

    if (clienteError) throw clienteError;
    const cliente = clientes && clientes[0] ? clientes[0] : null;

    if (!cliente) {
      return { cliente: null, processos: [] };
    }

    // 2) Buscar processos do cliente (assume-se que processos têm campo cliente_id)
    const { data: processos, error: procError } = await supabase
      .from('processos')
      .select('id, numero_processo, movimentacoes, updated_at, status')
      .eq('cliente_id', cliente.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (procError) throw procError;

    return { cliente, processos: processos || [] };
  } catch (error: any) {
    console.error('[ContextService] Erro ao obter contexto:', error.message || error);
    return { cliente: null, processos: [] };
  }
}
