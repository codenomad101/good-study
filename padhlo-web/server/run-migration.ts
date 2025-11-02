import { config } from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

async function runMigration() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  
  try {
    console.log('🔄 Running database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/db/migrations/0000_classy_swordsman.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();

