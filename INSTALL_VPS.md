# Guia de Instalação Profissional - Facilita ADV em VPS

Este guia fornece o procedimento passo a passo para implantar o **Facilita ADV** em um servidor VPS (Ubuntu 22.04 ou 24.04 LTS).

---

## 📋 Pré-requisitos

- Servidor VPS com Ubuntu (recomendado 2GB RAM ou mais).
- Domínio configurado apontando para o IP da VPS.
- Projeto configurado no **Supabase**.
- Credenciais **Google OAuth** (para integração com calendário/e-mail).

---

## 🚀 Passo a Passo da Instalação

### 1. Preparação do Sistema
Atualize o sistema e instale as ferramentas básicas:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential wget
```

### 2. Instalação do Node.js (via NVM)
É altamente recomendado usar o NVM para gerenciar versões do Node:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

### 3. Clonagem e Dependências
Clone o repositório e instale os pacotes:
```bash
cd /var/www
sudo git clone https://github.com/artbras/facilita.adv.br.git
sudo chown -R $USER:$USER facilita.adv.br
cd facilita.adv.br
npm install
```

### 4. Configuração do Ambiente (.env)
Crie e edite o arquivo de variáveis:
```bash
cp .env.example .env
nano .env
```
**Variáveis Críticas:**
- `VITE_SUPABASE_URL`: URL do seu projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: Chave anônima pública.
- `SUPABASE_SERVICE_ROLE_KEY`: **Importante** para funções de background e notificações de prazos.
- `VITE_GOOGLE_CLIENT_ID` / `CLIENT_SECRET`: Para as integrações Google.
- `PORT`: 5000 (padrão).

### 5. Build da Aplicação
Compile o frontend para produção:
```bash
npm run build
```
*Isso gerará os arquivos estáticos na pasta `server/public`.*

### 6. Gestão de Processos com PM2
Instale o PM2 para manter o servidor rodando e iniciar após reboots:
```bash
npm install -g pm2
pm2 start npm --name "facilita-adv" -- run start
pm2 save
pm2 startup
```
*(Siga as instruções que o comando `pm2 startup` exibirá no terminal).*

### 7. Configuração do Reverse Proxy (Nginx)
Instale o Nginx e crie o arquivo de configuração:
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/facilita
```
**Cole a configuração abaixo:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    # Ajuste para headers grandes (IA/Google Sync)
    large_client_header_buffers 4 32k;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Otimização de Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```
Ative o site e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/facilita /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Certificado SSL (HTTPS)
Use o Certbot para segurança gratuita:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com.br
```

---

## 🛠️ Comandos de Manutenção

| Objetivo | Comando |
|----------|---------|
| Atualizar o Código | `git pull && npm install && npm run build && pm2 restart facilita-adv` |
| Ver Logs em Tempo Real | `pm2 logs facilita-adv` |
| Ver Status do Servidor | `pm2 status` |
| Monitorar Memória/CPU | `pm2 monit` |

---

## ⚠️ Checklist de Troubleshooting

1. **Página em Branco**: Verifique se a pasta `server/public` existe e tem o arquivo `index.html`.
2. **Erro 431**: O sistema requer headers grandes. Verifique se o Nginx tem a linha `large_client_header_buffers 4 32k;`.
3. **Prazos não atualizam**: Certifique-se de que a `SUPABASE_SERVICE_ROLE_KEY` está correta no `.env`.
4. **Google OAuth Negado**: Garanta que `https://seu-dominio.com.br` está na lista de origens permitidas no Google Cloud.

---
*Versão do Guia: 2025.12*
*Facilita ADV - Excelência em Gestão Jurídica*
