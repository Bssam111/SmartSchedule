/**
 * Test Login Script
 * Tests the login endpoint with various users to verify password hashing works correctly
 */

const bcrypt = require('bcryptjs');

// Test password hash from database (password123)
const TEST_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
const TEST_PASSWORD = 'password123';

console.log('🔍 Testing Password Hashing...\n');

// Test 1: Verify the hash matches the password
console.log('Test 1: Verifying password hash');
const isValid = bcrypt.compareSync(TEST_PASSWORD, TEST_HASH);
console.log(`Password: ${TEST_PASSWORD}`);
console.log(`Hash: ${TEST_HASH.substring(0, 30)}...`);
console.log(`Match: ${isValid ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: Test login API endpoint
console.log('Test 2: Testing login API endpoint');
const API_URL = process.env.API_URL || 'https://handsome-radiance-production.up.railway.app/api';
const testUsers = [
  { email: 'dr.ahmed@ksu.edu.sa', password: 'password123', role: 'FACULTY' },
  { email: 'student@example.com', password: 'password123', role: 'STUDENT' },
  { email: 'faculty@example.com', password: 'password123', role: 'FACULTY' },
  { email: 'committee@ksu.edu.sa', password: 'password123', role: 'COMMITTEE' },
];

async function testLogin(email, password) {
  try {
    console.log(`\nTesting login for: ${email}`);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const contentType = response.headers.get('content-type');
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${contentType}`);

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`Response:`, JSON.stringify(data, null, 2));
      
      if (response.ok && data.success) {
        console.log(`✅ Login successful for ${email}`);
        console.log(`User: ${data.user?.name} (${data.user?.role})`);
        return true;
      } else {
        console.log(`❌ Login failed: ${data.error || data.message}`);
        return false;
      }
    } else {
      const text = await response.text();
      console.log(`❌ Non-JSON response: ${text.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log(`Using API URL: ${API_URL}\n`);
  
  let passed = 0;
  let failed = 0;

  for (const user of testUsers) {
    const result = await testLogin(user.email, user.password);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${testUsers.length}`);
}

// Run tests
if (typeof fetch === 'undefined') {
  console.log('⚠️  fetch is not available. Install node-fetch or run in Node.js 18+');
  console.log('Password hash test result:', isValid ? '✅ PASS' : '❌ FAIL');
} else {
  runTests().catch(console.error);
}


