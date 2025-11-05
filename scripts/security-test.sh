#!/bin/bash

# SmartSchedule Security Test Script
# This script performs comprehensive security testing

set -e

echo "🔒 SmartSchedule Security Test Suite"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
API_BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
TEST_EMAIL="security-test@example.com"
TEST_PASSWORD="SecurityTest123!"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Function to check if service is running
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        print_result 0 "$service_name is running"
    else
        print_result 1 "$service_name is not running"
    fi
}

# Function to test security headers
test_security_headers() {
    echo -e "\n${YELLOW}Testing Security Headers...${NC}"
    
    local response=$(curl -s -I "$API_BASE_URL/api/health")
    
    # Check for security headers
    if echo "$response" | grep -q "Strict-Transport-Security"; then
        print_result 0 "HSTS header present"
    else
        print_result 1 "HSTS header missing"
    fi
    
    if echo "$response" | grep -q "X-Frame-Options"; then
        print_result 0 "X-Frame-Options header present"
    else
        print_result 1 "X-Frame-Options header missing"
    fi
    
    if echo "$response" | grep -q "X-Content-Type-Options"; then
        print_result 0 "X-Content-Type-Options header present"
    else
        print_result 1 "X-Content-Type-Options header missing"
    fi
    
    if echo "$response" | grep -q "Content-Security-Policy"; then
        print_result 0 "CSP header present"
    else
        print_result 1 "CSP header missing"
    fi
}

# Function to test rate limiting
test_rate_limiting() {
    echo -e "\n${YELLOW}Testing Rate Limiting...${NC}"
    
    # Test authentication rate limiting
    local rate_limit_hit=false
    for i in {1..6}; do
        response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_BASE_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@example.com","password":"wrong","role":"STUDENT"}')
        
        if [ "$response" = "429" ]; then
            rate_limit_hit=true
            break
        fi
    done
    
    if [ "$rate_limit_hit" = true ]; then
        print_result 0 "Authentication rate limiting working"
    else
        print_result 1 "Authentication rate limiting not working"
    fi
}

# Function to test input validation
test_input_validation() {
    echo -e "\n${YELLOW}Testing Input Validation...${NC}"
    
    # Test XSS prevention
    local xss_payload='<script>alert("xss")</script>'
    response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"test@example.com\",\"password\":\"ValidPass123!\",\"name\":\"$xss_payload\",\"role\":\"STUDENT\"}")
    
    if [ "$response" = "400" ]; then
        print_result 0 "XSS prevention working"
    else
        print_result 1 "XSS prevention not working"
    fi
    
    # Test SQL injection prevention
    local sql_payload="'; DROP TABLE users; --"
    response=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_BASE_URL/api/users/$sql_payload")
    
    if [ "$response" = "404" ] || [ "$response" = "400" ]; then
        print_result 0 "SQL injection prevention working"
    else
        print_result 1 "SQL injection prevention not working"
    fi
    
    # Test weak password rejection
    response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"123","name":"Test User","role":"STUDENT"}')
    
    if [ "$response" = "400" ]; then
        print_result 0 "Weak password rejection working"
    else
        print_result 1 "Weak password rejection not working"
    fi
}

# Function to test RBAC
test_rbac() {
    echo -e "\n${YELLOW}Testing RBAC...${NC}"
    
    # Register a student user
    local student_token=$(curl -s -X POST "$API_BASE_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test Student\",\"role\":\"STUDENT\"}" \
        | jq -r '.token // empty')
    
    if [ -z "$student_token" ]; then
        print_result 1 "Failed to register test user"
        return
    fi
    
    # Test student cannot access admin endpoints
    response=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_BASE_URL/api/users" \
        -H "Authorization: Bearer $student_token")
    
    if [ "$response" = "403" ]; then
        print_result 0 "RBAC: Student correctly denied admin access"
    else
        print_result 1 "RBAC: Student incorrectly allowed admin access"
    fi
    
    # Test student can access their own profile
    response=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_BASE_URL/api/auth/me" \
        -H "Authorization: Bearer $student_token")
    
    if [ "$response" = "200" ]; then
        print_result 0 "RBAC: Student can access own profile"
    else
        print_result 1 "RBAC: Student cannot access own profile"
    fi
}

# Function to test CORS
test_cors() {
    echo -e "\n${YELLOW}Testing CORS...${NC}"
    
    # Test CORS headers
    local response=$(curl -s -I -H "Origin: https://malicious-site.com" "$API_BASE_URL/api/health")
    
    if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
        print_result 1 "CORS: Allowing unauthorized origin"
    else
        print_result 0 "CORS: Correctly blocking unauthorized origin"
    fi
}

# Function to test SSL/TLS (if HTTPS)
test_ssl() {
    echo -e "\n${YELLOW}Testing SSL/TLS...${NC}"
    
    if [[ "$API_BASE_URL" == https* ]]; then
        # Test SSL certificate
        if openssl s_client -connect "${API_BASE_URL#https://}" -servername "${API_BASE_URL#https://}" < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
            print_result 0 "SSL certificate valid"
        else
            print_result 1 "SSL certificate invalid"
        fi
    else
        echo -e "${YELLOW}⚠️  SSL testing skipped (HTTP only)${NC}"
    fi
}

# Function to test file upload security
test_file_upload() {
    echo -e "\n${YELLOW}Testing File Upload Security...${NC}"
    
    # Create a test file
    echo "test content" > /tmp/test.txt
    
    # Test file upload with malicious extension
    response=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$API_BASE_URL/api/upload" \
        -F "file=@/tmp/test.txt;filename=malicious.php")
    
    if [ "$response" = "400" ] || [ "$response" = "415" ]; then
        print_result 0 "File upload security working"
    else
        print_result 1 "File upload security not working"
    fi
    
    # Cleanup
    rm -f /tmp/test.txt
}

# Function to test authentication security
test_auth_security() {
    echo -e "\n${YELLOW}Testing Authentication Security...${NC}"
    
    # Test token expiration
    local expired_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.invalid"
    
    response=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_BASE_URL/api/auth/me" \
        -H "Authorization: Bearer $expired_token")
    
    if [ "$response" = "401" ]; then
        print_result 0 "Token expiration handling working"
    else
        print_result 1 "Token expiration handling not working"
    fi
    
    # Test invalid token format
    response=$(curl -s -w "%{http_code}" -o /dev/null -X GET "$API_BASE_URL/api/auth/me" \
        -H "Authorization: Bearer invalid-token")
    
    if [ "$response" = "401" ]; then
        print_result 0 "Invalid token handling working"
    else
        print_result 1 "Invalid token handling not working"
    fi
}

# Function to run performance tests
test_performance() {
    echo -e "\n${YELLOW}Testing Performance...${NC}"
    
    # Test response time
    local start_time=$(date +%s%N)
    curl -s "$API_BASE_URL/api/health" > /dev/null
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then
        print_result 0 "Response time acceptable (${response_time}ms)"
    else
        print_result 1 "Response time too slow (${response_time}ms)"
    fi
}

# Main test execution
main() {
    echo "Starting security tests..."
    echo "API Base URL: $API_BASE_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo ""
    
    # Check if services are running
    check_service "$API_BASE_URL/api/health" "Backend API"
    check_service "$FRONTEND_URL" "Frontend"
    
    # Run security tests
    test_security_headers
    test_rate_limiting
    test_input_validation
    test_rbac
    test_cors
    test_ssl
    test_file_upload
    test_auth_security
    test_performance
    
    echo -e "\n${GREEN}🎉 Security tests completed successfully!${NC}"
    echo -e "\n${YELLOW}Security Checklist:${NC}"
    echo "✅ Security headers implemented"
    echo "✅ Rate limiting active"
    echo "✅ Input validation working"
    echo "✅ RBAC properly configured"
    echo "✅ CORS correctly configured"
    echo "✅ Authentication security measures"
    echo "✅ Performance within acceptable limits"
    
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Review security logs for any anomalies"
    echo "2. Run penetration testing"
    echo "3. Update security documentation"
    echo "4. Schedule regular security audits"
}

# Run main function
main "$@"
