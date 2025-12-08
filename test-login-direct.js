/**
 * Direct Login Test Script
 * Run this with: node test-login-direct.js
 * Tests login directly against the Railway backend
 */

const https = require('https');

const API_URL = 'https://handsome-radiance-production.up.railway.app/api/auth/login';

const testUsers = [
  { email: 'dr.ahmed@ksu.edu.sa', password: 'password123', name: 'Dr. Ahmed Al-Mansouri' },
  { email: 'student@example.com', password: 'password123', name: 'John Student' },
  { email: 'faculty@example.com', password: 'password123', name: 'Dr. Jane Faculty' },
  { email: 'committee@ksu.edu.sa', password: 'password123', name: 'Academic Committee' },
];

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
          } else {
            resolve({ status: res.statusCode, data: body, headers: res.headers });
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testLogin(user) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${user.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${user.password}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const result = await makeRequest(API_URL, {
      email: user.email,
      password: user.password,
    });

    console.log(`Status: ${result.status}`);
    console.log(`Response:`, JSON.stringify(result.data, null, 2));

    if (result.status === 200 && result.data.success) {
      console.log(`✅ SUCCESS - Login worked!`);
      console.log(`User: ${result.data.user?.name} (${result.data.user?.role})`);
      return true;
    } else {
      console.log(`❌ FAILED - ${result.data.error || result.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🔍 Testing Login Endpoint');
  console.log(`API URL: ${API_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const user of testUsers) {
    const result = await testLogin(user);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    // Wait between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL RESULTS');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${testUsers.length}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run tests
runAllTests().catch(console.error);


