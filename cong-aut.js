import { exec } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configurar dotenv com caminho correto
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: `${__dirname}/.env.local` });

const { SUPABASE_PASSWORD } = process.env;

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = `backup_k_${timestamp}.dump`;

const command = `docker run --rm --network host \
  -e PGPASSWORD="${SUPABASE_PASSWORD}" \
  -v $(pwd):/backup \
  postgres:17 \
  pg_dump -h db.zskyvltkzcpkelusvbbm.supabase.co -p 5432 -U postgres -d postgres -F c -f /backup/${backupFile}`;

console.log('🔄 Iniciando backup com Docker PostgreSQL 17...');
exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Erro:', error.message);
        console.error('📋 Detalhes:', stderr);
        return;
    }
    console.log('✅ Backup concluído:', backupFile);
});