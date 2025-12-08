import { initializeEmailService, sendEmail } from '../utils/email'

async function testEmail() {
  console.log('🧪 Testing email service...')
  
  // Initialize email service
  const initialized = initializeEmailService()
  if (!initialized) {
    console.error('❌ Email service failed to initialize')
    console.error('Check SMTP configuration:')
    console.error('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET')
    console.error('  SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET')
    console.error('  SMTP_USER:', process.env.SMTP_USER || 'NOT SET')
    console.error('  SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'NOT SET')
    console.error('  SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET')
    process.exit(1)
  }
  
  console.log('✅ Email service initialized')
  
  // Test sending an email
  const testEmail = process.env.TEST_EMAIL || 'test@example.com'
  console.log(`📧 Sending test email to: ${testEmail}`)
  
  const result = await sendEmail(
    testEmail,
    'Test Email from SmartSchedule',
    '<h1>Test Email</h1><p>This is a test email from SmartSchedule.</p>'
  )
  
  if (result) {
    console.log('✅ Test email sent successfully!')
  } else {
    console.error('❌ Test email failed to send')
    process.exit(1)
  }
  
  process.exit(0)
}

testEmail()

