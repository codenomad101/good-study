import { db } from './src/db';
import { jobs, NewJob } from './src/db/schema';

// Sample jobs data
const sampleJobs: NewJob[] = [
  {
    name: 'mpsc',
    displayName: 'MPSC (Maharashtra Public Service Commission)',
    description: 'Maharashtra Public Service Commission examinations for various government positions',
    shortCode: 'MPSC',
    totalMarks: 200,
    durationMinutes: 180,
    totalQuestions: 100,
    minQualification: 'Graduation',
    ageLimit: 38,
    experienceRequired: 'No experience required',
    sortOrder: 1,
    status: 'active',
    isActive: true
  },
  {
    name: 'grade_b',
    displayName: 'Grade-B Officer',
    description: 'Grade-B level government officer examinations',
    shortCode: 'GRADE-B',
    totalMarks: 150,
    durationMinutes: 120,
    totalQuestions: 75,
    minQualification: 'Graduation',
    ageLimit: 35,
    experienceRequired: '2-3 years experience preferred',
    sortOrder: 2,
    status: 'active',
    isActive: true
  },
  {
    name: 'grade_c',
    displayName: 'Grade-C Officer',
    description: 'Grade-C level government officer examinations',
    shortCode: 'GRADE-C',
    totalMarks: 100,
    durationMinutes: 90,
    totalQuestions: 50,
    minQualification: '12th Pass',
    ageLimit: 30,
    experienceRequired: 'No experience required',
    sortOrder: 3,
    status: 'active',
    isActive: true
  },
  {
    name: 'bank_po',
    displayName: 'Bank Probationary Officer',
    description: 'Banking sector examinations for Probationary Officer positions',
    shortCode: 'BANK-PO',
    totalMarks: 200,
    durationMinutes: 120,
    totalQuestions: 100,
    minQualification: 'Graduation',
    ageLimit: 30,
    experienceRequired: 'No experience required',
    sortOrder: 4,
    status: 'active',
    isActive: true
  },
  {
    name: 'ssc_cgl',
    displayName: 'SSC CGL (Combined Graduate Level)',
    description: 'Staff Selection Commission Combined Graduate Level Examination',
    shortCode: 'SSC-CGL',
    totalMarks: 200,
    durationMinutes: 120,
    totalQuestions: 100,
    minQualification: 'Graduation',
    ageLimit: 32,
    experienceRequired: 'No experience required',
    sortOrder: 5,
    status: 'active',
    isActive: true
  }
];

async function seedJobs() {
  try {
    console.log('🌱 Seeding jobs...');
    
    for (const job of sampleJobs) {
      await db.insert(jobs).values(job);
      console.log(`✅ Created job: ${job.displayName} (${job.shortCode})`);
    }
    
    console.log('🎉 All jobs seeded successfully!');
    console.log('📝 You can now:');
    console.log('   1. View jobs at http://localhost:5173/jobs');
    console.log('   2. Create practice sessions with job-specific questions');
    console.log('   3. Manage jobs through the admin interface');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
    process.exit(1);
  }
}

seedJobs();
