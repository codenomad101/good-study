import { db } from '../db/index';
import { availableExams } from '../db/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';

config();

const MPSC_EXAMS = [
  { name: 'MPSC Group B (Non-Gazetted) Prelims', date: '2025-01-05' },
  { name: 'MPSC Group C Prelims', date: '2025-06-01' },
  { name: 'MPSC Group C Mains', date: '2026-01-07' },
  { name: 'MPSC Rajyaseva Prelims', date: '2025-11-09' },
  { name: 'MPSC Group B Mains', date: '2026-12-05' },
];

async function addMPSCExams() {
  try {
    console.log('🚀 Starting to add MPSC exams to available_exams table...\n');
    
    let added = 0;
    let skipped = 0;
    
    for (const exam of MPSC_EXAMS) {
      // Check if exam already exists
      const existing = await db
        .select()
        .from(availableExams)
        .where(eq(availableExams.examName, exam.name))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(availableExams).values({
          examName: exam.name,
          examDate: exam.date,
          isActive: true,
          sortOrder: 0,
        });
        console.log(`✅ Added: ${exam.name}`);
        added++;
      } else {
        console.log(`⊘ Already exists: ${exam.name}`);
        skipped++;
      }
    }
    
    console.log('\n🎉 MPSC exams added successfully!');
    console.log(`📊 Summary: ${added} added, ${skipped} already existed`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error adding MPSC exams:', error);
    process.exit(1);
  }
}

addMPSCExams();

