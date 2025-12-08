import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('👤 Creating admin account...')

  // Default admin credentials
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ksu.edu.sa'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#'
  const adminName = process.env.ADMIN_NAME || 'System Administrator'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log(`ℹ️  Admin account already exists: ${adminEmail}`)
    console.log('   If you want to reset the password, delete the account first or use a different email.')
    return
  }

  // Hash password
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      password: passwordHash,
      role: 'ADMIN',
      universityId: 'ADM0001',
      requiresPasswordChange: false
    }
  })

  console.log('✅ Admin account created successfully!')
  console.log('\n📋 Admin Credentials:')
  console.log(`   Email: ${admin.email}`)
  console.log(`   Password: ${adminPassword}`)
  console.log(`   University ID: ${admin.universityId}`)
  console.log('\n⚠️  Please change the password after first login!')
  console.log('\n💡 To create admin with custom credentials, set environment variables:')
  console.log('   ADMIN_EMAIL=your-email@ksu.edu.sa')
  console.log('   ADMIN_PASSWORD=YourSecurePassword123!')
  console.log('   ADMIN_NAME="Your Name"')
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin account:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
