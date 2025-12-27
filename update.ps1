# Script de Atualização automática do Repositório GitHub
# Uso: .\update.ps1 "Sua mensagem de commit"

param (
    [string]$commitMessage = "Atualização automática: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
)

Write-Host "--- Iniciando atualização do GitHub ---" -ForegroundColor Cyan

# 1. Puxar alterações remotas para evitar conflitos
Write-Host "Puxando alterações remotas..." -ForegroundColor Yellow
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao fazer git pull. Resolva os conflitos antes de continuar." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Adicionar todas as mudanças
Write-Host "Adicionando mudanças..." -ForegroundColor Yellow
git add .

# 3. Commit
Write-Host "Realizando commit: '$commitMessage'..." -ForegroundColor Yellow
git commit -m "$commitMessage"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Nada para commitar ou erro no commit." -ForegroundColor Gray
}

# 4. Push
Write-Host "Enviando para o GitHub..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao fazer git push." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "--- Repositório atualizado com sucesso! ---" -ForegroundColor Green
