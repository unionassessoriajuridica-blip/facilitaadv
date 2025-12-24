import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingEnvVars: string[] = [];

if (!supabaseUrl) {
  missingEnvVars.push('VITE_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  missingEnvVars.push('VITE_SUPABASE_ANON_KEY');
}

if (missingEnvVars.length > 0) {
  const errorMessage = `
    ============================================
    ERRO DE CONFIGURACAO - FacilitaAdv
    ============================================
    
    Variaveis de ambiente obrigatorias nao encontradas:
    ${missingEnvVars.map(v => `  - ${v}`).join('\n')}
    
    Para corrigir:
    1. Crie um arquivo .env na raiz do projeto
    2. Adicione as variaveis:
       VITE_SUPABASE_URL=sua_url_do_supabase
       VITE_SUPABASE_ANON_KEY=sua_chave_anonima
    3. Reinicie o servidor
    
    ============================================
  `;
  console.error(errorMessage);
  
  if (typeof window !== 'undefined') {
    (window as any).__FACILITA_ENV_ERROR__ = missingEnvVars;
  }
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
