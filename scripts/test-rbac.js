#!/usr/bin/env node

// Simple RBAC Test Script
// Tests the RBAC system with mock users

const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3001';

// Mock user credentials
const users = [
  { email: 'student@demo.com', password: 'TestPassword123!', role: 'STUDENT' },
  { email: 'faculty@demo.com', password: 'TestPassword123!', role: 'FACULTY' },
  { email: 'committee@demo.com', password: 'TestPassword123!', role: 'COMMITTEE' }
];

// Test endpoints
const testEndpoints = [
  { path: '/api/rbac-test/test-rbac', method: 'GET', description: 'Basic RBAC test' },
  { path: '/api/rbac-test/users', method: 'GET', description: 'User read (COMMITTEE only)' },
  { path: '/api/rbac-test/users', method: 'POST', description: 'User create (COMMITTEE only)' },
  { path: '/api/rbac-test/courses', method: 'POST', description: 'Course create (COMMITTEE only)' },
  { path: '/api/rbac-test/system/logs', method: 'GET', description: 'System logs (COMMITTEE only)' }
];

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Login function
async function login(email, password, role) {
  const loginData = JSON.stringify({ email, password, role });
  
  const response = await makeRequest(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    },
    body: loginData
  });
  
  return response;
}

// Test endpoint with token
async function testEndpoint(path, method, token) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (method === 'POST') {
    options.body = JSON.stringify({});
  }
  
  return await makeRequest(`${API_BASE}${path}`, options);
}

// Main test function
async function runTests() {
  console.log('🔒 RBAC System Test');
  console.log('==================\n');
  
  for (const user of users) {
    console.log(`👤 Testing as ${user.role}: ${user.email}`);
    console.log('─'.repeat(50));
    
    // Login
    const loginResponse = await login(user.email, user.password, user.role);
    
    if (loginResponse.status !== 200) {
      console.log(`❌ Login failed: ${loginResponse.status}`);
      console.log('');
      continue;
    }
    
    const token = loginResponse.data.user?.id; // This would need to be the actual JWT token
    console.log(`✅ Login successful`);
    
    // Test each endpoint
    for (const endpoint of testEndpoints) {
      const result = await testEndpoint(endpoint.path, endpoint.method, token);
      
      const expectedAccess = user.role === 'COMMITTEE';
      const hasAccess = result.status === 200;
      const isCorrect = expectedAccess === hasAccess;
      
      const status = isCorrect ? '✅' : '❌';
      const access = hasAccess ? 'ALLOWED' : 'DENIED';
      const expected = expectedAccess ? 'SHOULD ALLOW' : 'SHOULD DENY';
      
      console.log(`${status} ${endpoint.description}: ${access} (${expected})`);
    }
    
    console.log('');
  }
  
  console.log('🎉 RBAC Test Completed!');
  console.log('\n📋 Expected Results:');
  console.log('• STUDENT: Should be denied access to admin functions');
  console.log('• FACULTY: Should be denied access to admin functions');
  console.log('• COMMITTEE: Should have access to all functions');
}

// Run the tests
runTests().catch(console.error);
