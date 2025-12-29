#!/bin/bash

# ========================================
# Script de Deploy Automático - FacilitaAdv
# ========================================
# Atualiza código do GitHub e reinicia aplicação
# Uso: ./deploy.sh

set -e  # Para em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Deploy FacilitaAdv - GitHub Pull${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 1. Backup do .env (não deve ser sobrescrito)
echo -e "${YELLOW}[1/7] Fazendo backup do .env...${NC}"
if [ -f .env ]; then
    cp .env .env.backup
    echo -e "${GREEN}✓ Backup criado: .env.backup${NC}"
else
    echo -e "${RED}⚠ Arquivo .env não encontrado!${NC}"
fi

# 2. Parar aplicação (se estiver rodando)
echo -e "${YELLOW}[2/7] Parando aplicação...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 stop facilita-adv 2>/dev/null || echo "App não estava rodando"
    echo -e "${GREEN}✓ Aplicação parada${NC}"
elif pgrep -f "tsx server/index.ts" > /dev/null; then
    pkill -f "tsx server/index.ts"
    echo -e "${GREEN}✓ Processo Node parado${NC}"
else
    echo -e "${GREEN}✓ Nenhuma aplicação rodando${NC}"
fi

# 3. Stash de mudanças locais (se houver)
echo -e "${YELLOW}[3/7] Salvando mudanças locais...${NC}"
git stash push -m "Auto-stash before deploy $(date +%Y%m%d-%H%M%S)" || true
echo -e "${GREEN}✓ Mudanças locais salvas${NC}"

# 4. Pull do GitHub
echo -e "${YELLOW}[4/7] Baixando código do GitHub...${NC}"
git pull origin main || {
    echo -e "${RED}✗ Erro ao fazer git pull!${NC}"
    echo -e "${YELLOW}Restaurando .env...${NC}"
    cp .env.backup .env 2>/dev/null || true
    exit 1
}
echo -e "${GREEN}✓ Código atualizado${NC}"

# 5. Restaurar .env (garantir que não foi sobrescrito)
echo -e "${YELLOW}[5/7] Restaurando .env...${NC}"
if [ -f .env.backup ]; then
    cp .env.backup .env
    echo -e "${GREEN}✓ .env restaurado${NC}"
fi

# 6. Instalar dependências (se package.json mudou)
echo -e "${YELLOW}[6/7] Instalando dependências...${NC}"
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    echo "package.json foi alterado, instalando dependências..."
    npm install
    echo -e "${GREEN}✓ Dependências instaladas${NC}"
else
    echo -e "${GREEN}✓ package.json não mudou, skip${NC}"
fi

# 7. Build (apenas em produção, dev usa vite)
# Descomentar se estiver em produção:
# echo -e "${YELLOW}[7/7] Building aplicação...${NC}"
# npm run build
# echo -e "${GREEN}✓ Build completo${NC}"

# 8. Reiniciar aplicação
echo -e "${YELLOW}[7/7] Reiniciando aplicação...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 start ecosystem.config.js --env production || pm2 restart facilita-adv
    pm2 save
    echo -e "${GREEN}✓ Aplicação reiniciada com PM2${NC}"
else
    echo -e "${YELLOW}PM2 não encontrado. Iniciando com npm...${NC}"
    nohup npm run dev > app.log 2>&1 &
    echo -e "${GREEN}✓ Aplicação iniciada em background${NC}"
fi

# Status final
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Logs: tail -f app.log (ou pm2 logs facilita-adv)"
echo -e "Stash salvo em: git stash list"
echo ""
