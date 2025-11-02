import bcrypt from 'bcryptjs';
import { db } from './server/src/db';
import { users } from './server/src/db/schema';

async function createDummyUsers() {
  try {
    console.log('Creating dummy users...');

    const dummyUsers = [
      {
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
      },
      {
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
      },
      {
        username: 'student2',
        email: 'student2@padhlo.com',
        passwordHash: await bcrypt.hash('student123', 12),
        fullName: 'Rajesh Kumar',
        role: 'student' as const,
        phone: '+91 9876543212',
        isActive: true,
        isVerified: true,
        totalPoints: 500,
        level: 5,
        coins: 200,
        currentStreak: 8,
        longestStreak: 20,
        totalStudyTimeMinutes: 2000,
      },
      {
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
      },
      {
        username: 'testuser',
        email: 'test@padhlo.com',
        passwordHash: await bcrypt.hash('test123', 12),
        fullName: 'Test User',
        role: 'student' as const,
        phone: '+91 9876543214',
        isActive: true,
        isVerified: true,
        totalPoints: 100,
        level: 2,
        coins: 50,
        currentStreak: 3,
        longestStreak: 10,
        totalStudyTimeMinutes: 500,
      }
    ];

    // Clear existing users first
    await db.delete(users);
    console.log('Cleared existing users');

    // Insert dummy users
    const createdUsers = await db.insert(users).values(dummyUsers).returning();
    
    console.log('Created dummy users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.fullName} (${user.role}): ${user.email} / ${user.username}`);
    });

    console.log('\nLogin credentials:');
    console.log('Admin: admin@padhlo.com / admin123');
    console.log('Student 1: student1@padhlo.com / student123');
    console.log('Student 2: student2@padhlo.com / student123');
    console.log('Moderator: moderator@padhlo.com / moderator123');
    console.log('Test User: test@padhlo.com / test123');
    console.log('\nYou can also login with usernames: admin, student1, student2, moderator1, testuser');

  } catch (error) {
    console.error('Error creating dummy users:', error);
  }
}

createDummyUsers();
