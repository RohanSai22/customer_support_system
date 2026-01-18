#!/bin/bash

# Quick Setup Script for Customer Support System

echo "🚀 Setting up Customer Support System..."

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

# Check Bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install from https://bun.sh"
    exit 1
fi
echo "✅ Bun installed"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install from https://docker.com"
    exit 1
fi
echo "✅ Docker installed"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
bun install

# Setup environment files
echo ""
echo "🔧 Setting up environment files..."

if [ ! -f "packages/db/.env" ]; then
    cp packages/db/.env.example packages/db/.env
    echo "✅ Created packages/db/.env"
else
    echo "⚠️  packages/db/.env already exists"
fi

if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env"
    echo "⚠️  Don't forget to add your GOOGLE_GENERATIVE_AI_API_KEY in apps/api/.env"
else
    echo "⚠️  apps/api/.env already exists"
fi

if [ ! -f "apps/web/.env.local" ]; then
    cp apps/web/.env.example apps/web/.env.local
    echo "✅ Created apps/web/.env.local"
else
    echo "⚠️  apps/web/.env.local already exists"
fi

# Start Docker database
echo ""
echo "🐳 Starting Docker database..."
docker compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Setup database
echo ""
echo "🗄️  Setting up database..."
cd packages/db
bun run generate
bun run push
bun run seed
cd ../..

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add your Gemini API key to apps/api/.env"
echo "   Get one free at: https://ai.google.dev"
echo "2. Run 'bun run dev' to start the development servers"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "🎉 Happy coding!"
