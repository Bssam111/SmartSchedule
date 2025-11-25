import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function exportUsersToCSV() {
  console.log('📋 Exporting all registered users to CSV...\n')

  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            authenticators: true
          }
        }
      }
    })

    if (users.length === 0) {
      console.log('❌ No users found in the database.')
      return
    }

    // Create CSV content
    const headers = ['ID', 'Email', 'Name', 'Role', 'University ID', 'Fingerprints Registered', 'Created At', 'Updated At']
    const rows = users.map(user => [
      user.id,
      user.email,
      user.name,
      user.role,
      user.universityId || 'N/A',
      user._count.authenticators.toString(),
      user.createdAt.toISOString(),
      user.updatedAt.toISOString()
    ])

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ].join('\n')

    // Write to file
    const outputPath = path.join(process.cwd(), 'users-export.csv')
    fs.writeFileSync(outputPath, csvContent, 'utf-8')

    console.log(`✅ Successfully exported ${users.length} user(s) to: ${outputPath}`)
    console.log('\n📊 Summary:')
    console.log(`   Total Users: ${users.length}`)
    console.log(`   Students: ${users.filter(u => u.role === 'STUDENT').length}`)
    console.log(`   Faculty: ${users.filter(u => u.role === 'FACULTY').length}`)
    console.log(`   Committee: ${users.filter(u => u.role === 'COMMITTEE').length}`)
    console.log(`   Users with Fingerprints: ${users.filter(u => u._count.authenticators > 0).length}`)

  } catch (error) {
    console.error('❌ Error exporting users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
exportUsersToCSV()
  .then(() => {
    console.log('\n✅ Export completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Export failed:', error)
    process.exit(1)
  })

