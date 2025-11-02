import 'dotenv/config';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('Seeding users (admin, moderator, student)...');

    const adminPassword = await bcrypt.hash('admin123', 12);
    const studentPassword = await bcrypt.hash('student123', 12);
    const moderatorPassword = await bcrypt.hash('moderator123', 12);

    const users = [
      {
        username: 'admin',
        email: 'admin@padhlo.com',
        passwordHash: adminPassword,
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
        passwordHash: studentPassword,
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
        username: 'moderator1',
        email: 'moderator@padhlo.com',
        passwordHash: moderatorPassword,
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
    ];

    for (const u of users) {
      const rows = await sql`
        INSERT INTO users (
          username, email, password_hash, full_name, role, phone,
          is_active, is_verified, total_points, level, coins,
          current_streak, longest_streak, total_study_time_minutes
        ) VALUES (
          ${u.username}, ${u.email}, ${u.passwordHash}, ${u.fullName}, cast(${u.role} as user_role), ${u.phone},
          ${u.isActive}, ${u.isVerified}, ${u.totalPoints}, ${u.level}, ${u.coins},
          ${u.currentStreak}, ${u.longestStreak}, ${u.totalStudyTimeMinutes}
        )
        ON CONFLICT (email)
        DO UPDATE SET
          username = EXCLUDED.username,
          password_hash = EXCLUDED.password_hash,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          phone = EXCLUDED.phone,
          is_active = EXCLUDED.is_active,
          is_verified = EXCLUDED.is_verified,
          total_points = EXCLUDED.total_points,
          level = EXCLUDED.level,
          coins = EXCLUDED.coins,
          current_streak = EXCLUDED.current_streak,
          longest_streak = EXCLUDED.longest_streak,
          total_study_time_minutes = EXCLUDED.total_study_time_minutes
        RETURNING user_id, email, role
      `;

      const r = rows[0] as { user_id: string; email: string; role: 'admin' | 'student' | 'moderator' };
      console.log(`Upserted: ${u.fullName} (${r.role}) -> ${r.email}`);
    }

    console.log('\nLogin credentials:');
    console.log('Admin: admin@padhlo.com / admin123 (or username: admin)');
    console.log('Student: student1@padhlo.com / student123 (or username: student1)');
    console.log('Moderator: moderator@padhlo.com / moderator123 (or username: moderator1)');
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

main();


