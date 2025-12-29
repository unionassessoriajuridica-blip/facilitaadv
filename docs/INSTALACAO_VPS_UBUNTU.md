# Instalacao do FacilitaAdv em VPS Ubuntu 24.04

Este guia explica como instalar e configurar o FacilitaAdv em um servidor VPS com Ubuntu 24.04.

## Requisitos

- VPS com Ubuntu 24.04 LTS
- Minimo 2GB RAM, 2 vCPU
- Dominio configurado apontando para o IP da VPS
- Conta no Supabase (banco de dados)
- Conta no ZapSign (assinatura digital)
- Conta no Resend (envio de emails)
- Credenciais do Google Cloud Console (Gmail, Calendar, Drive)

## Passo 1: Atualizar o Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

## Passo 2: Instalar Node.js 20

```bash
# Instalar curl se nao tiver
sudo apt install -y curl

# Adicionar repositorio NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalacao
node --version  # Deve mostrar v20.x.x
npm --version
```

## Passo 3: Instalar Git e Clonar o Repositorio

```bash
# Instalar Git
sudo apt install -y git

# Criar diretorio para a aplicacao
sudo mkdir -p /var/www
cd /var/www

# Clonar o repositorio
sudo git clone https://github.com/artbras/facilita.adv.br.git facilitaadv
cd facilitaadv

# Dar permissoes ao usuario atual
sudo chown -R $USER:$USER /var/www/facilitaadv
```

## Passo 4: Instalar Dependencias

```bash
cd /var/www/facilitaadv

# Instalar dependencias do projeto
npm install
```

## Passo 5: Configurar Variaveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
nano .env
```

Adicione as seguintes variaveis (substitua pelos seus valores):

```env
VITE_APP_URL=http://facilita.adv.br:5000
VITE_GOOGLE_CLIENT_ID=90141190775-umb0unbs2p364trac8kt6t12onrt85ak.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=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
VITE_SUPABASE_URL=https://zskyvltkzcpkelusvbbm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza3l2bHRremNwa2VsdXN2YmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzMsImV4cCI6MjA3MDE4NjA3M30.SSkuEXqIIG316-9d-YX1hbj-XRIN0uBZr6KEsjuhLuc
GOOGLE_CLIENT_SECRET=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
GOOGLE_CLIENT_ID=90141190775-umb0unbs2p364trac8kt6t12onrt85ak.apps.googleusercontent.com
SUPABASE_URL=https://zskyvltkzcpkelusvbbm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza3l2bHRremNwa2VsdXN2YmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTAwNzMsImV4cCI6MjA3MDE4NjA3M30.SSkuEXqIIG316-9d-YX1hbj-XRIN0uBZr6KEsjuhLuc
DATAJUD_API_KEY=cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
OPENAI_API_KEY=
RESEND_API_KEY=re_Daxz5hgU_9cPhx4tT7saQCQ3ZRWouJCGb
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza3l2bHRremNwa2VsdXN2YmJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYxMDA3MywiZXhwIjoyMDcwMTg2MDczfQ.BijO6tdmnjPBpH_4YRFhoIL5lMaU3R016Sy0Sy6ZaXs
ZAPSIGN_API_TOKEN=44edada3-08f2-4e92-9f52-525c16bbf85383868400-12f1-4c69-a912-bb34e1ef9350
SESSION_SECRET=BI2R36FaPhmP+ck3x3eM5KDwLxZ2oHMqpN2veWyjahrnEpBYkKw3ufJMLCPDIUpVcpYO0M53cOF4jqZke/H5+A==
# Producao
NODE_ENV=production
PORT=5000
```

Salve com `Ctrl+X`, depois `Y`, depois `Enter`.

## Passo 6: Compilar a Aplicacao

```bash
cd /var/www/facilitaadv

# Compilar o frontend
npm run build
```

## Passo 7: Instalar PM2 (Gerenciador de Processos)

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar a aplicacao com PM2
pm2 start npm --name "facilitaadv" -- run start

# Configurar para iniciar automaticamente no boot
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
pm2 save
```

## Passo 8: Instalar e Configurar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuracao do site
sudo nano /etc/nginx/sites-available/facilitaadv
```

Cole a seguinte configuracao (substitua `seudominio.com.br`):

```nginx
server {
    listen 80;
    server_name facilita.adv.br www.facilita.adv.br;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Salve e ative o site:

```bash
# Criar link simbolico
sudo ln -s /etc/nginx/sites-available/facilitaadv /etc/nginx/sites-enabled/

# Remover site padrao (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuracao
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Passo 9: Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL (substitua pelo seu email e dominio)
sudo certbot --nginx -d facilita.adv.br -d www.facilita.adv.br

# Renovacao automatica ja esta configurada
# Para testar: sudo certbot renew --dry-run
```

## Passo 10: Configurar Firewall

```bash
# Habilitar UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar status
sudo ufw status
```

## Passo 11: Configurar Webhook do ZapSign

Apos a instalacao, configure o webhook no painel do ZapSign:

1. Acesse o painel do ZapSign
2. Va em Configuracoes > Webhooks
3. Adicione novo webhook:
   - URL: `https://facilita.adv.br/api/zapsign/webhook`
   - Evento: `documento-assinado`
4. (Opcional) Configure um secret e adicione como `ZAPSIGN_WEBHOOK_SECRET` no `.env`

## Passo 12: Configurar Google OAuth

No Google Cloud Console:

1. Acesse APIs e Servicos > Credenciais
2. Edite seu OAuth 2.0 Client ID
3. Em "URIs de redirecionamento autorizados", adicione:
   - `https://facilita.adv.br/api/auth/google/callback`
   - `https://facilita.adv.br/google-callback`

## Comandos Uteis

### Verificar status da aplicacao
```bash
pm2 status
pm2 logs facilitaadv
```

### Reiniciar aplicacao
```bash
pm2 restart facilitaadv
```

### Atualizar aplicacao

Quando voce fizer alteracoes no codigo (via Replit ou localmente) e enviar ao GitHub, execute estes comandos na VPS para atualizar:

```bash
cd /var/www/facilitaadv
git pull origin main
npm install
npm run build
pm2 restart facilitaadv
```

**Explicacao de cada comando:**
- `git pull origin main` - Baixa as alteracoes mais recentes do GitHub
- `npm install` - Instala novas dependencias (se houver alteracoes no package.json)
- `npm run build` - Recompila o frontend para producao
- `pm2 restart facilitaadv` - Reinicia a aplicacao com as novas alteracoes

**Dica:** Voce pode criar um script para automatizar:

```bash
nano /var/www/facilitaadv/atualizar.sh
```

Cole o conteudo:

```bash
#!/bin/bash
cd /var/www/facilitaadv
echo "Baixando alteracoes do GitHub..."
git pull origin main
echo "Instalando dependencias..."
npm install
echo "Compilando aplicacao..."
npm run build
echo "Reiniciando aplicacao..."
pm2 restart facilitaadv
echo "Atualizacao concluida!"
```

Salve e de permissao de execucao:

```bash
chmod +x /var/www/facilitaadv/atualizar.sh
```

Depois, para atualizar basta executar:

```bash
/var/www/facilitaadv/atualizar.sh
```

### Ver logs do Nginx
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Estrutura de Arquivos

```
/var/www/facilitaadv/
├── client/           # Frontend React
├── server/           # Backend Express
├── dist/             # Arquivos compilados
├── .env              # Variaveis de ambiente
└── package.json      # Dependencias
```

## Solucao de Problemas

### Erro 502 Bad Gateway
- Verifique se a aplicacao esta rodando: `pm2 status`
- Verifique os logs: `pm2 logs facilitaadv`

### Erro de conexao com Supabase
- Verifique as variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Confirme que o IP da VPS esta liberado no Supabase (Database > Settings > Network)

### Certificado SSL nao funciona
- Verifique se o dominio aponta para o IP correto
- Execute: `sudo certbot --nginx -d seudominio.com.br`

### Aplicacao nao inicia apos reboot
- Execute: `pm2 save` e depois `pm2 startup`

## Backup

Recomenda-se fazer backup regular do arquivo `.env` e das configuracoes do Nginx.

O banco de dados esta no Supabase e possui backup automatico.
