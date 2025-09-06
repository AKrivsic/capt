// Test script to verify authentication fixes
// Run with: node test-auth.js

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test session query (the problematic one)
    const sessions = await prisma.session.findMany({
      take: 1,
      include: { user: true },
    });
    console.log('✅ Session query successful');

    // Test user query
    const users = await prisma.user.findMany({
      take: 1,
    });
    console.log('✅ User query successful');

    console.log('\n🎉 All database tests passed!');
    console.log('The prepared statement issue should be resolved.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.message.includes('prepared statement')) {
      console.log('\n💡 This is the prepared statement error we\'re trying to fix.');
      console.log('Make sure your DATABASE_URL includes the pooling parameters:');
      console.log('DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Check environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('Please set it in your .env file or run:');
  console.log('DATABASE_URL="your-database-url" node test-auth.js');
  process.exit(1);
}

testDatabaseConnection().catch(console.error);
