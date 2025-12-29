
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
    console.log('--- TESTE DOCUMENTOS DRIVE ---');
    const { data, error } = await supabase
        .from('processo_documentos_drive')
        .select('*');

    if (error) {
        console.error('Erro na query:', error);
    } else {
        console.log('Total de registros:', data?.length);
        console.log('Registros:', JSON.stringify(data, null, 2));
    }
}

test();
