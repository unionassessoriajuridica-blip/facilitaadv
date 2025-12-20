import { exec } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Configurar dotenv com caminho correto
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: `${__dirname}/.env.local` });

const { SUPABASE_PASSWORD } = process.env;

// Função para listar backups disponíveis
function listBackups() {
    const files = fs.readdirSync(__dirname)
        .filter(file => file.startsWith('backup_k_') && file.endsWith('.dump'))
        .sort()
        .reverse();
    
    return files;
}

// Função para restaurar backup
function restoreBackup(backupFile) {
    if (!backupFile) {
        console.error('❌ Nenhum arquivo de backup especificado');
        return;
    }

    if (!fs.existsSync(`${__dirname}/${backupFile}`)) {
        console.error('❌ Arquivo de backup não encontrado');
        return;
    }

    const command = `docker run --rm --network host \
        -e PGPASSWORD="${SUPABASE_PASSWORD}" \
        -v $(pwd):/backup \
        postgres:17 \
        pg_restore -h db.zskyvltkzcpkelusvbbm.supabase.co -p 5432 -U postgres -d postgres -c --if-exists -F c /backup/${backupFile}`;

    console.log(`🔄 Restaurando backup: ${backupFile}...`);
    exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Erro na restauração:', error.message);
            console.error('📋 Detalhes:', stderr);
            return;
        }
        console.log('✅ Restauração concluída com sucesso!');
    });
}

// Script interativo
const backups = listBackups();

if (backups.length === 0) {
    console.log('❌ Nenhum backup encontrado');
    process.exit(1);
}

console.log('📦 Backups disponíveis:');
backups.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
});

// Para uso automático (restaura o mais recente)
const latestBackup = backups[0];
console.log(`\n🔄 Restaurando backup mais recente: ${latestBackup}`);
restoreBackup(latestBackup);