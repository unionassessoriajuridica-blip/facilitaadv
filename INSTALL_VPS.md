# Guia de Instalacao - FacilitaAdv em VPS Ubuntu 24.04

## Requisitos do Sistema

- Ubuntu 24.04 LTS
- Node.js 20+ (recomendado: usar nvm)
- npm ou pnpm
- Git

## Passo 1: Instalar Node.js

```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Recarregar terminal
source ~/.bashrc

# Instalar Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verificar instalacao
node -v  # Deve mostrar v20.x.x
npm -v
```

## Passo 2: Clonar o Repositorio

```bash
cd /var/www  # ou outro diretorio de sua preferencia
git clone https://github.com/artbras/facilita.adv.br.git
cd facilita.adv.br
```

## Passo 3: Configurar Variaveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
nano .env
```

Adicione as seguintes variaveis (OBRIGATORIAS):

```env
# Supabase (OBRIGATORIO)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Google OAuth (para integracoes Google)
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=seu-client-secret

# ZapSign (para assinatura digital)
ZAPSIGN_API_TOKEN=seu-token-zapsign

# Servidor
PORT=5000
NODE_ENV=production
```

### Onde encontrar as credenciais:

1. **Supabase**: 
   - Acesse https://supabase.com/dashboard
   - Selecione seu projeto
   - Va em Settings > API
   - Copie "Project URL" e "anon public" key

2. **Google OAuth**:
   - Acesse https://console.cloud.google.com
   - APIs & Services > Credentials
   - Crie um OAuth 2.0 Client ID
   - Adicione seu dominio em Authorized redirect URIs

3. **ZapSign**:
   - Acesse https://app.zapsign.com.br
   - Configuracoes > API
   - Copie seu token

## Passo 4: Instalar Dependencias

```bash
npm install
```

## Passo 5: Build para Producao

```bash
npm run build
```

Este comando cria a pasta `server/public` com os arquivos compilados.

## Passo 6: Iniciar o Servidor

```bash
# Modo producao
npm run start

# Ou com PM2 (recomendado para producao)
npm install -g pm2
pm2 start npm --name "facilitaadv" -- run start
pm2 save
pm2 startup
```

## Passo 7: Configurar Nginx (Recomendado)

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/facilitaadv
```

Adicione a configuracao:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

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
    }
}
```

Ative o site:

```bash
sudo ln -s /etc/nginx/sites-available/facilitaadv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Passo 8: SSL com Certbot (Recomendado)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com.br
```

## Verificacao de Problemas

### Pagina em Branco

Se a pagina ficar em branco:

1. **Verificar variaveis de ambiente**:
   ```bash
   cat .env
   ```
   Certifique-se que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estao definidas.

2. **Verificar se o build foi feito**:
   ```bash
   ls -la server/public
   ```
   A pasta deve existir e conter arquivos HTML/JS/CSS.

3. **Verificar logs do servidor**:
   ```bash
   pm2 logs facilitaadv
   ```

4. **Reconstruir o app**:
   ```bash
   npm run build
   pm2 restart facilitaadv
   ```

### Erro de Conexao com Supabase

1. Verifique se as credenciais estao corretas
2. Verifique se o IP da VPS esta liberado no Supabase (Database > Settings > Connection pooling)

### Erro de Google OAuth

1. Verifique se o dominio esta configurado no Google Cloud Console
2. Adicione a URL de callback correta: `https://seu-dominio.com.br/api/google/system/callback`

## Comandos Uteis

```bash
# Ver status do PM2
pm2 status

# Ver logs
pm2 logs facilitaadv

# Reiniciar app
pm2 restart facilitaadv

# Parar app
pm2 stop facilitaadv

# Reconstruir e reiniciar
npm run build && pm2 restart facilitaadv
```

## Atualizacoes

Para atualizar o sistema:

```bash
cd /var/www/facilita.adv.br
git pull origin main
npm install
npm run build
pm2 restart facilitaadv
```
