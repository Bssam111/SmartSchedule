// Simple test to check login validation
const { loginSchema } = require('./backend/src/utils/validation.ts');

console.log('Login schema:', loginSchema);

try {
  const result = loginSchema.parse({
    email: 'student@demo.com',
    password: 'TestPassword123!'
  });
  console.log('Validation successful:', result);
} catch (error) {
  console.log('Validation error:', error);
}
