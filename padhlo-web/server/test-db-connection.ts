import { db } from './src/db';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Simple test query
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    console.log('📊 Test result:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if PostgreSQL is running: sudo systemctl status postgresql');
    console.log('2. Check your .env file for DATABASE_URL');
    console.log('3. Try connecting manually: psql -U postgres -h localhost');
    console.log('4. Create database if needed: createdb padhlo_db');
    
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🚀 Ready to seed database!');
    process.exit(0);
  } else {
    process.exit(1);
  }
});


