$env:Path = "C:\Program Files\nodejs;" + $env:Path

Write-Host "🚀 Starting Project Setup..." -ForegroundColor Cyan

# 1. Generate Prisma Client
Write-Host "`n📦 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Error "Prisma Generate failed"; exit }

# 2. Push Database Schema
Write-Host "`n🗄️  Pushing DB Schema..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) { Write-Error "Prisma DB Push failed"; exit }

# 3. Seed Database (Optional - usually good for dev reset, but we can make it standard for this demo)
Write-Host "`n🌱 Seeding Database..." -ForegroundColor Yellow
node prisma/seed.js
if ($LASTEXITCODE -ne 0) { Write-Error "Database Seeding failed"; exit }

# 4. Start Next.js Dev Server
Write-Host "`n✨ Starting Next.js Server..." -ForegroundColor Green
npm run dev
