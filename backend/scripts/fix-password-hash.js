/**
 * Fix Password Hash Script
 * Generates correct bcrypt hash for password123 and updates database
 * Run with: node backend/scripts/fix-password-hash.js
 */

const bcrypt = require('bcryptjs');

const PASSWORD = 'password123';
const TEST_EMAILS = [
  'student@example.com',
  'dr.ahmed@ksu.edu.sa',
  'faculty@example.com',
  'committee@ksu.edu.sa',
  'committee@ksu.edu.sa',
];

console.log('🔍 Generating new password hash...\n');

// Generate hash with same settings as registration (12 rounds)
bcrypt.hash(PASSWORD, 12).then(newHash => {
  console.log('Password:', PASSWORD);
  console.log('New Hash:', newHash);
  console.log('Old Hash (from SQL): $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy\n');
  
  // Verify the new hash works
  bcrypt.compare(PASSWORD, newHash).then(match => {
    console.log('New hash matches password:', match ? '✅ YES' : '❌ NO');
    
    // Test old hash
    const oldHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    bcrypt.compare(PASSWORD, oldHash).then(oldMatch => {
      console.log('Old hash matches password:', oldMatch ? '✅ YES' : '❌ NO');
      
      if (!oldMatch) {
        console.log('\n❌ PROBLEM: Old hash does NOT match password!');
        console.log('This means the hash in the database is incorrect.\n');
        console.log('SOLUTION: Update database with new hash:');
        console.log('\nSQL to run:');
        console.log('-- Update password hash for all test users');
        TEST_EMAILS.forEach(email => {
          console.log(`UPDATE users SET password = '${newHash}' WHERE email = '${email}';`);
        });
      } else {
        console.log('\n✅ Old hash is correct, but something else is wrong.');
        console.log('Check if password is being sent correctly in the request.');
      }
    });
  });
}).catch(err => {
  console.error('Error:', err);
});


