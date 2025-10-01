@echo off
REM SmartSchedule Backend Setup Script for Windows

echo 🚀 Setting up SmartSchedule Backend...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 20+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env file with your database URL and JWT secret
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

REM Check database connection
echo 🔍 Testing database connection...
call npm run db:push >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Database connection failed. Please check your DATABASE_URL in .env
    echo    Example: DATABASE_URL="postgresql://username:password@localhost:5432/smartschedule"
    pause
    exit /b 1
)

echo ✅ Database connection successful

REM Run tests
echo 🧪 Running tests...
call npm run test >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Some tests failed, but setup continues...
) else (
    echo ✅ Tests passed
)

REM Build the application
echo 🏗️  Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo 🎉 Backend setup complete!
echo.
echo Next steps:
echo 1. Start the development server: npm run dev
echo 2. The API will be available at http://localhost:3001
echo 3. Update your frontend to use the new API endpoints
echo.
echo For more information, see the MIGRATION_GUIDE.md file
pause
