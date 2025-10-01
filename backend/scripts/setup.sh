#!/bin/bash

# SmartSchedule Backend Setup Script

echo "🚀 Setting up SmartSchedule Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your database URL and JWT secret"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Check if database is accessible
echo "🔍 Testing database connection..."
if npm run db:push > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed. Please check your DATABASE_URL in .env"
    echo "   Example: DATABASE_URL=\"postgresql://username:password@localhost:5432/smartschedule\""
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
if npm run test > /dev/null 2>&1; then
    echo "✅ Tests passed"
else
    echo "⚠️  Some tests failed, but setup continues..."
fi

# Build the application
echo "🏗️  Building application..."
npm run build

echo ""
echo "🎉 Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. The API will be available at http://localhost:3001"
echo "3. Update your frontend to use the new API endpoints"
echo ""
echo "For more information, see the MIGRATION_GUIDE.md file"
