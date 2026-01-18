# Quick Setup Script for Customer Support System

Write-Host "🚀 Setting up Customer Support System..." -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Bun
if (!(Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Bun is not installed. Please install from https://bun.sh" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Bun installed" -ForegroundColor Green

# Check Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install from https://docker.com" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker installed" -ForegroundColor Green

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
bun install

# Setup environment files
Write-Host "`n🔧 Setting up environment files..." -ForegroundColor Yellow

if (!(Test-Path "packages\db\.env")) {
    Copy-Item "packages\db\.env.example" "packages\db\.env"
    Write-Host "✅ Created packages/db/.env" -ForegroundColor Green
} else {
    Write-Host "⚠️  packages/db/.env already exists" -ForegroundColor Yellow
}

if (!(Test-Path "apps\api\.env")) {
    Copy-Item "apps\api\.env.example" "apps\api\.env"
    Write-Host "✅ Created apps/api/.env" -ForegroundColor Green
    Write-Host "⚠️  Don't forget to add your GOOGLE_GENERATIVE_AI_API_KEY in apps/api/.env" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  apps/api/.env already exists" -ForegroundColor Yellow
}

if (!(Test-Path "apps\web\.env.local")) {
    Copy-Item "apps\web\.env.example" "apps\web\.env.local"
    Write-Host "✅ Created apps/web/.env.local" -ForegroundColor Green
} else {
    Write-Host "⚠️  apps/web/.env.local already exists" -ForegroundColor Yellow
}

# Start Docker database
Write-Host "`n🐳 Starting Docker database..." -ForegroundColor Yellow
docker compose up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Setup database
Write-Host "`n🗄️  Setting up database..." -ForegroundColor Yellow
Set-Location packages\db
bun run generate
bun run push
bun run seed
Set-Location ..\..

Write-Host "`n✨ Setup complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Add your Gemini API key to apps/api/.env" -ForegroundColor White
Write-Host "   Get one free at: https://ai.google.dev" -ForegroundColor Gray
Write-Host "2. Run 'bun run dev' to start the development servers" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "`n🎉 Happy coding!" -ForegroundColor Cyan
