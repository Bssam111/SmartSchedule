// Test to see what loginSchema actually expects
const { z } = require('zod');

// Recreate the loginSchema without transforms to see the base structure
const testLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

console.log('Test Schema Shape:', testLoginSchema.shape);
console.log('Test Schema Keys:', Object.keys(testLoginSchema.shape));

try {
  const result = testLoginSchema.parse({
    email: 'student@demo.com',
    password: 'TestPassword123!'
  });
  console.log('✅ Validation passed:', result);
} catch (error) {
  console.log('❌ Validation failed:', error.issues);
}

// Now test with role
try {
  const result2 = testLoginSchema.parse({
    email: 'student@demo.com',
    password: 'TestPassword123!',
    role: 'STUDENT'
  });
  console.log('✅ Validation with role passed:', result2);
} catch (error) {
  console.log('❌ Validation with role failed:', error.issues);
}

