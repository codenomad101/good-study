import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { users } from './server/src/db/schema';

config();

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function createUsers() {
  try {
    console.log('Creating users...');

    // Create admin user
    const adminUser = {
      username: 'admin',
      email: 'admin@padhlo.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      fullName: 'Admin User',
      role: 'admin' as const,
      phone: '+91 9876543210',
      isActive: true,
      isVerified: true,
      totalPoints: 1000,
      level: 10,
      coins: 500,
      currentStreak: 30,
      longestStreak: 50,
      totalStudyTimeMinutes: 5000,
    };

    const admin = await db.insert(users).values(adminUser).returning();
    console.log('Created admin user:', admin[0].fullName);

    // Create student user
    const studentUser = {
      username: 'student1',
      email: 'student1@padhlo.com',
      passwordHash: await bcrypt.hash('student123', 12),
      fullName: 'Priya Sharma',
      role: 'student' as const,
      phone: '+91 9876543211',
      isActive: true,
      isVerified: true,
      totalPoints: 750,
      level: 7,
      coins: 300,
      currentStreak: 15,
      longestStreak: 25,
      totalStudyTimeMinutes: 3000,
    };

    const student = await db.insert(users).values(studentUser).returning();
    console.log('Created student user:', student[0].fullName);

    // Create moderator user
    const moderatorUser = {
      username: 'moderator1',
      email: 'moderator@padhlo.com',
      passwordHash: await bcrypt.hash('moderator123', 12),
      fullName: 'Anita Singh',
      role: 'moderator' as const,
      phone: '+91 9876543213',
      isActive: true,
      isVerified: true,
      totalPoints: 800,
      level: 8,
      coins: 400,
      currentStreak: 20,
      longestStreak: 35,
      totalStudyTimeMinutes: 4000,
    };

    const moderator = await db.insert(users).values(moderatorUser).returning();
    console.log('Created moderator user:', moderator[0].fullName);

    console.log('\nLogin credentials:');
    console.log('Admin: admin@padhlo.com / admin123 (or username: admin)');
    console.log('Student: student1@padhlo.com / student123 (or username: student1)');
    console.log('Moderator: moderator@padhlo.com / moderator123 (or username: moderator1)');

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await client.end();
  }
}

createUsers();

