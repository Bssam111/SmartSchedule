import { prisma } from '@/config/database'

async function checkDatabase() {
  console.log('🔍 Checking database connection and access requests...\n')

  // Check DATABASE_URL
  const dbUrl = process.env['DATABASE_URL']
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set!')
    return
  }

  // Show database URL (masked for security)
  const urlParts = dbUrl.split('@')
  if (urlParts.length > 1) {
    const maskedUrl = dbUrl.substring(0, 20) + '***@' + urlParts[1]
    console.log('📊 Database URL:', maskedUrl)
  } else {
    console.log('📊 Database URL:', dbUrl.substring(0, 50) + '...')
  }

  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful\n')

    // Count access requests
    const totalRequests = await prisma.accessRequest.count()
    const pendingRequests = await prisma.accessRequest.count({
      where: { status: 'PENDING' }
    })
    const approvedRequests = await prisma.accessRequest.count({
      where: { status: 'APPROVED' }
    })
    const rejectedRequests = await prisma.accessRequest.count({
      where: { status: 'REJECTED' }
    })

    console.log('📋 Access Requests Summary:')
    console.log(`   Total: ${totalRequests}`)
    console.log(`   Pending: ${pendingRequests}`)
    console.log(`   Approved: ${approvedRequests}`)
    console.log(`   Rejected: ${rejectedRequests}\n`)

    // List recent requests
    if (totalRequests > 0) {
      console.log('📝 Recent Access Requests (last 10):')
      const recentRequests = await prisma.accessRequest.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          desiredRole: true,
          status: true,
          createdAt: true
        }
      })

      recentRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.email} - ${req.fullName} (${req.desiredRole}) - ${req.status} - ${req.createdAt.toISOString()}`)
      })
    } else {
      console.log('⚠️  No access requests found in database')
    }

    // Check EmailOTP table
    const otpCount = await prisma.emailOTP.count()
    console.log(`\n📧 Email OTPs in database: ${otpCount}`)

    // Check Users
    const userCount = await prisma.user.count()
    console.log(`👥 Users in database: ${userCount}`)

    // Check Majors
    const majorCount = await prisma.major.count()
    console.log(`🎓 Majors in database: ${majorCount}`)

    if (majorCount > 0) {
      const majors = await prisma.major.findMany({
        select: { id: true, name: true }
      })
      console.log('   Majors:', majors.map(m => m.name).join(', '))
    }

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

