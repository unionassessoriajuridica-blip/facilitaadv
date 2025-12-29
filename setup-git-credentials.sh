#!/bin/bash

# ========================================
# Setup Git Credentials - Apenas Primeira Vez
# ========================================
# Configura autenticação do GitHub com token
# Uso: ./setup-git-credentials.sh

set -e

echo "========================================="
echo "  Configurando Git Credentials"
echo "========================================="
echo ""

# Configurar usuário
echo "Configurando usuário Git..."
git config user.name "artbras"
git config user.email "seu-email@exemplo.com"  # Alterar para seu email

# Configurar URL remota com token embarcado (SEGURO via credential helper)
echo "Configurando remote URL..."
git remote set-url origin https://artbras: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@github.com/artbras/facilita.adv.br.git

# Configurar credential helper (cache por 1 hora)
echo "Configurando credential helper..."
git config --global credential.helper 'cache --timeout=3600'

# Testar conexão
echo ""
echo "Testando conexão com GitHub..."
if git ls-remote origin &> /dev/null; then
    echo "✓ Conexão bem-sucedida!"
else
    echo "✗ Erro na conexão. Verifique o token."
    exit 1
fi

echo ""
echo "========================================="
echo "  ✓ Git configurado com sucesso!"
echo "========================================="
echo ""
echo "Agora você pode executar: ./deploy.sh"
echo ""

# IMPORTANTE: Deletar este arquivo após executar (segurança)
echo "ATENÇÃO: Este arquivo contém o token. Deletando..."
rm -f setup-git-credentials.sh
echo "✓ Arquivo deletado por segurança."
