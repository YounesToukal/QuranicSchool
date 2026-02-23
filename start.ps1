# QuranDec - Script de démarrage automatique
Write-Host "--- Demarrage de QuranDec ---" -ForegroundColor Green

# Vérifier Node.js
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js n'est pas installe." -ForegroundColor Red
    exit 1
}

# Vérifier PostgreSQL
$pgVersion = psql --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "PostgreSQL n'est pas installe ou pas dans le PATH." -ForegroundColor Red
    exit 1
}

# Installation dépendances
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation frontend..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Installation backend..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
}

# Initialisation DB
$initDb = Read-Host "Voulez-vous initialiser la base de données ? (o/N)"
if ($initDb -eq "o" -or $initDb -eq "O") {
    Push-Location backend
    npm run seed
    Pop-Location
}

# Démarrage
Write-Host "Demarrage du backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Start-Sleep -Seconds 3

Write-Host "Demarrage du frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "Application en cours de demarrage sur http://localhost:3000" -ForegroundColor Cyan