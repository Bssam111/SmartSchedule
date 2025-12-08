/**
 * Verify Password Hash
 * Tests if the password hash in the database matches the password
 */

const bcrypt = require('bcryptjs');

// Hash from database (password123)
const DB_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
const TEST_PASSWORD = 'password123';

console.log('🔍 Verifying Password Hash\n');
console.log('Password:', TEST_PASSWORD);
console.log('Hash from DB:', DB_HASH);
console.log('');

// Test 1: Compare with bcrypt
console.log('Test 1: bcrypt.compareSync');
const match1 = bcrypt.compareSync(TEST_PASSWORD, DB_HASH);
console.log(`Result: ${match1 ? '✅ MATCH' : '❌ NO MATCH'}\n`);

// Test 2: Compare async
console.log('Test 2: bcrypt.compare (async)');
bcrypt.compare(TEST_PASSWORD, DB_HASH).then(match2 => {
  console.log(`Result: ${match2 ? '✅ MATCH' : '❌ NO MATCH'}\n`);
  
  // Test 3: Generate new hash and compare
  console.log('Test 3: Generate new hash for same password');
  bcrypt.hash(TEST_PASSWORD, 10).then(newHash => {
    console.log('New hash:', newHash.substring(0, 30) + '...');
    bcrypt.compare(TEST_PASSWORD, newHash).then(match3 => {
      console.log(`New hash matches password: ${match3 ? '✅ YES' : '❌ NO'}\n`);
      
      // Test 4: Compare new hash with DB hash (should be different but both valid)
      console.log('Test 4: Compare new hash with DB hash');
      console.log('Note: Different hashes for same password should both work');
      console.log(`DB hash works: ${match1 ? '✅' : '❌'}`);
      console.log(`New hash works: ${match3 ? '✅' : '❌'}`);
    });
  });
});


