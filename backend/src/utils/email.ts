// Lazy import nodemailer to avoid crashing if module is missing
let nodemailer: typeof import('nodemailer') | null = null
try {
  nodemailer = require('nodemailer')
} catch (error) {
  console.warn('⚠️  nodemailer module not found. Email functionality will be disabled.')
  console.warn('⚠️  Install nodemailer: npm install nodemailer')
}

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

let transporter: any = null
let emailConfig: EmailConfig | null = null

/**
 * Initialize email transporter with SMTP configuration
 */
export function initializeEmailService() {
  if (!nodemailer) {
    console.warn('⚠️  Email service not available: nodemailer module not installed.')
    return false
  }

  const smtpHost = process.env['SMTP_HOST']
  const smtpPort = process.env['SMTP_PORT']
  const smtpUser = process.env['SMTP_USER']
  const smtpPass = process.env['SMTP_PASS']
  const smtpFrom = process.env['SMTP_FROM'] || process.env['SMTP_USER'] || 'noreply@smartschedule.ksu.edu.sa'
  const smtpSecure = process.env['SMTP_SECURE'] !== 'false'

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('⚠️  Email service not configured. SMTP credentials missing.')
    console.warn('⚠️  Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables to enable email sending.')
    return false
  }

  try {
    emailConfig = {
      host: smtpHost,
      port: Number.parseInt(smtpPort, 10),
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      from: smtpFrom
    }

    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates in development
        ciphers: 'SSLv3' // Some SMTP servers require specific cipher
      },
      // For port 587 (STARTTLS), requireTLS should be true
      requireTLS: emailConfig.port === 587,
      // For port 465 (SSL/TLS), secure should be true
      // For port 587 (STARTTLS), secure should be false
      debug: process.env.NODE_ENV === 'development', // Enable debug in development
      logger: process.env.NODE_ENV === 'development' // Enable logging in development
    })
    
    // Verify connection configuration
    console.log('📧 SMTP Configuration:', {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      requireTLS: emailConfig.port === 587,
      user: emailConfig.auth.user,
      from: emailConfig.from
    })

    console.log('✅ Email service initialized')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error)
    return false
  }
}

/**
 * Send an email
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!nodemailer) {
    console.error('❌ Email service not available: nodemailer module not installed.')
    console.error('❌ Install nodemailer: npm install nodemailer')
    return false
  }

  // Try to initialize if not already initialized
  if (!transporter || !emailConfig) {
    console.warn('⚠️  Email service not initialized. Attempting to initialize...')
    const initialized = initializeEmailService()
    if (!initialized || !emailConfig) {
      console.error('❌ Email service not initialized. Email not sent to:', to)
      console.error('❌ Subject:', subject)
      console.error('❌ Check SMTP configuration: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS')
      return false
    }
  }

  // TypeScript guard: emailConfig should be non-null at this point
  if (!emailConfig || !transporter) {
    console.error('❌ Email service not available. Email not sent to:', to)
    return false
  }

  try {
    console.log(`📧 Attempting to send email to: ${to}`)
    console.log(`📧 From: ${emailConfig.from}, Subject: ${subject}`)
    
    const result = await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      text: text || html.replaceAll(/<[^>]*>/g, ''), // Strip HTML for text version
      html
    })

    console.log(`✅ Email sent successfully to: ${to}`)
    console.log(`📧 Email message ID: ${result.messageId}`)
    if (result.response) {
      console.log(`📧 SMTP response: ${result.response}`)
    }
    return true
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}:`, error)
    console.error(`❌ Error message: ${error.message}`)
    if (error.code) {
      console.error(`❌ Error code: ${error.code}`)
    }
    if (error.command) {
      console.error(`❌ SMTP command: ${error.command}`)
    }
    if (error.response) {
      console.error(`❌ SMTP response: ${error.response}`)
    }
    if (error.responseCode) {
      console.error(`❌ SMTP response code: ${error.responseCode}`)
    }
    return false
  }
}

/**
 * Send acceptance email to approved access request
 */
export async function sendAcceptanceEmail(
  recipientName: string,
  recipientEmail: string,
  role: string,
  universityId: string,
  temporaryPassword: string,
  majorName?: string,
  loginUrl: string = process.env['FRONTEND_URL'] || 'http://localhost:3000'
): Promise<boolean> {
  const roleDisplay = role === 'STUDENT' ? 'Student' : 'Faculty'
  const subject = `🎉 Congratulations! Your SmartSchedule ${roleDisplay} Account is Ready`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    .credentials { background-color: #fff; border: 2px solid #2563eb; border-radius: 5px; padding: 15px; margin: 20px 0; }
    .credential-item { margin: 10px 0; }
    .label { font-weight: bold; color: #1e40af; }
    .value { font-family: monospace; background-color: #f3f4f6; padding: 5px 10px; border-radius: 3px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SmartSchedule</h1>
      <p>Access Request Approved</p>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      
      <p><strong>Congratulations!</strong> We are pleased to inform you that your access request to SmartSchedule has been <strong>approved</strong>.</p>
      
      <p>Your ${roleDisplay.toLowerCase()} account has been successfully created and is ready to use.</p>
      
      <div class="info-box">
        <p><strong>Your Account Details:</strong></p>
        <ul>
          <li><strong>Role:</strong> ${roleDisplay}</li>
          <li><strong>University ID:</strong> ${universityId}</li>
          ${majorName ? `<li><strong>Major:</strong> ${majorName}</li>` : ''}
        </ul>
      </div>
      
      <div class="credentials">
        <p><strong>Your Login Credentials:</strong></p>
        <div class="credential-item">
          <span class="label">Email:</span>
          <span class="value">${recipientEmail}</span>
        </div>
        <div class="credential-item">
          <span class="label">Temporary Password:</span>
          <span class="value">${temporaryPassword}</span>
        </div>
      </div>
      
      <p><strong>Important:</strong> Please change your password immediately after your first login for security purposes.</p>
      
      <p style="text-align: center;">
        <a href="${loginUrl}/login" class="button">Sign In to SmartSchedule</a>
      </p>
      
      <p>If you have any questions or need assistance, please contact the system administrator.</p>
      
      <p>Best regards,<br>SmartSchedule Committee</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} SmartSchedule. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail(recipientEmail, subject, html)
}

/**
 * Send confirmation email when access request is submitted
 */
export async function sendConfirmationEmail(
  recipientName: string,
  recipientEmail: string,
  desiredRole: string,
  majorName?: string,
  loginUrl: string = process.env['FRONTEND_URL'] || 'http://localhost:3000'
): Promise<boolean> {
  const roleDisplay = desiredRole === 'STUDENT' ? 'Student' : 'Faculty'
  const subject = 'Access Request Received - SmartSchedule'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background-color: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SmartSchedule</h1>
      <p>Access Request Received</p>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      
      <p>Thank you for submitting your access request to SmartSchedule. We have successfully received your request and it is now under review by our committee.</p>
      
      <div class="info-box">
        <p><strong>Request Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${recipientEmail}</li>
          <li><strong>Requested Role:</strong> ${roleDisplay}</li>
          ${majorName ? `<li><strong>Major:</strong> ${majorName}</li>` : ''}
        </ul>
      </div>
      
      <p><strong>What happens next?</strong></p>
      <p>Our administrator will review your request and notify you of their decision via email. This process typically takes a few business days.</p>
      
      <p>If your request is approved, you will receive an email with your account credentials and instructions on how to access the system.</p>
      
      <p>If you have any questions or need to update your request, please contact the system administrator.</p>
      
      <p>Best regards,<br>SmartSchedule Committee</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} SmartSchedule. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail(recipientEmail, subject, html)
}

/**
 * Send rejection email to rejected access request
 */
export async function sendRejectionEmail(
  recipientName: string,
  recipientEmail: string,
  decisionNote?: string,
  loginUrl: string = process.env['FRONTEND_URL'] || 'http://localhost:3000'
): Promise<boolean> {
  const subject = 'Access Request Decision - SmartSchedule'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SmartSchedule</h1>
      <p>Access Request Decision</p>
    </div>
    <div class="content">
      <p>Dear ${recipientName},</p>
      
      <p>Thank you for your interest in SmartSchedule. After careful review, we regret to inform you that your access request has been <strong>rejected</strong>.</p>
      
      ${decisionNote ? `
      <div class="info-box">
        <p><strong>Reviewer Note:</strong></p>
        <p>${decisionNote}</p>
      </div>
      ` : ''}
      
      <p>If you believe this decision was made in error, or if you have additional information that may be relevant, please feel free to submit a new request or contact the system administrator.</p>
      
      <p style="text-align: center;">
        <a href="${loginUrl}/register" class="button">Submit New Request</a>
      </p>
      
      <p>We appreciate your understanding.</p>
      
      <p>Best regards,<br>SmartSchedule Committee</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} SmartSchedule. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `

  return sendEmail(recipientEmail, subject, html)
}

// Initialize email service on module load (non-blocking)
if (process.env.NODE_ENV !== 'test') {
  // Don't block server startup if email fails
  setTimeout(() => {
    try {
      const initialized = initializeEmailService()
      if (initialized) {
        console.log('✅ Email service ready for sending')
      } else {
        console.warn('⚠️  Email service not initialized. Check SMTP configuration.')
      }
    } catch (error) {
      console.warn('⚠️  Email service initialization failed (non-critical):', error)
    }
  }, 0)
}

