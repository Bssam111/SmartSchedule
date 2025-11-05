#!/bin/bash

# SmartSchedule RBAC Demo Setup Script
# This script sets up the RBAC system with mock users for testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 SmartSchedule RBAC Demo Setup${NC}"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}❌ Please run this script from the SmartSchedule root directory${NC}"
    exit 1
fi

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Install dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"

# Step 2: Setup database
print_status "Setting up database..."
npx prisma generate
npx prisma db push
print_success "Database setup completed"

# Step 3: Create mock users
print_status "Creating mock users..."
npm run db:mock-users
print_success "Mock users created"

# Step 4: Build backend
print_status "Building backend..."
npm run build
print_success "Backend built successfully"

# Step 5: Install frontend dependencies
print_status "Installing frontend dependencies..."
cd ../smart-schedule
npm install
print_success "Frontend dependencies installed"

# Step 6: Build frontend
print_status "Building frontend..."
npm run build
print_success "Frontend built successfully"

cd ..

echo -e "\n${GREEN}🎉 RBAC Demo Setup Completed!${NC}"
echo "=================================="

echo -e "\n${YELLOW}📋 Demo Login Credentials:${NC}"
echo "┌─────────────────────┬─────────────────────┬─────────────┐"
echo "│ Email               │ Password            │ Role        │"
echo "├─────────────────────┼─────────────────────┼─────────────┤"
echo "│ student@demo.com    │ TestPassword123!    │ STUDENT     │"
echo "│ faculty@demo.com    │ TestPassword123!    │ FACULTY     │"
echo "│ committee@demo.com  │ TestPassword123!    │ COMMITTEE   │"
echo "│ admin@demo.com      │ TestPassword123!    │ COMMITTEE   │"
echo "└─────────────────────┴─────────────────────┴─────────────┘"

echo -e "\n${YELLOW}🚀 How to Test RBAC:${NC}"
echo "1. Start the backend: cd backend && npm run dev"
echo "2. Start the frontend: cd smart-schedule && npm run dev"
echo "3. Open http://localhost:3000/login"
echo "4. Login with different roles to test permissions"
echo "5. Visit http://localhost:3000/rbac-test to run permission tests"

echo -e "\n${YELLOW}🔧 RBAC Test Endpoints:${NC}"
echo "• GET  /api/rbac-test/test-rbac - Basic RBAC test"
echo "• GET  /api/rbac-test/users - Test user read permission"
echo "• POST /api/rbac-test/users - Test user create permission"
echo "• PUT  /api/rbac-test/users/:id - Test user update permission"
echo "• DELETE /api/rbac-test/users/:id - Test user delete permission"
echo "• GET  /api/rbac-test/permissions - View permission matrix"

echo -e "\n${YELLOW}📊 Expected Results:${NC}"
echo "• STUDENT: Can only access basic endpoints, denied admin functions"
echo "• FACULTY: Can access most endpoints, denied admin functions"
echo "• COMMITTEE: Can access all endpoints including admin functions"

echo -e "\n${GREEN}✅ Setup completed successfully!${NC}"
echo -e "${BLUE}💡 Tip: Use different browser tabs to test different roles${NC}"
