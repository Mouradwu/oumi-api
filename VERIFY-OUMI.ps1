# Script de vérification OUMI
Write-Host "Vérification de l'arborescence OUMI..." -ForegroundColor Cyan
Get-ChildItem -Path . -Directory | Select-Object Name
Write-Host "Vérification terminée." -ForegroundColor Green
