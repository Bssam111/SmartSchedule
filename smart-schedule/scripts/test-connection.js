// Test database connection with different credentials
const { PrismaClient } = require('@prisma/client')

const connectionStrings = [
  'postgresql://postgres:postgres@localhost:5432/smartschedule',
  'postgresql://postgres:@localhost:5432/smartschedule',
  'postgresql://postgres:password@localhost:5432/smartschedule',
  'postgresql://postgres:admin@localhost:5432/smartschedule',
  'postgresql://postgres:123456@localhost:5432/smartschedule',
  'postgresql://johndoe:password@localhost:5432/smartschedule',
  'postgresql://johndoe:@localhost:5432/smartschedule'
]

async function testConnection(connectionString) {
  console.log(`Testing: ${connectionString}`)
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionString
        }
      }
    })
    
    await prisma.$connect()
    console.log('✅ Connection successful!')
    await prisma.$disconnect()
    return connectionString
  } catch (error) {
    console.log('❌ Connection failed:', error.message.split('\n')[0])
    return null
  }
}

async function main() {
  console.log('🔍 Testing database connections...\n')
  
  for (const connectionString of connectionStrings) {
    const result = await testConnection(connectionString)
    if (result) {
      console.log(`\n🎉 Working connection found: ${result}`)
      console.log('\nTo use this connection, update your .env file with:')
      console.log(`DATABASE_URL=${result}`)
      return
    }
  }
  
  console.log('\n❌ No working connection found.')
  console.log('\nPlease check your PostgreSQL setup:')
  console.log('1. Make sure PostgreSQL is running')
  console.log('2. Check your username and password')
  console.log('3. Verify the database "smartschedule" exists')
  console.log('4. Check if the port is 5432')
}

main().catch(console.error)
