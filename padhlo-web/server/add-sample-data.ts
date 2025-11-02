import { config } from 'dotenv';
import { db } from './src/db';
import { exams, subjects, topics, questions } from './src/db/schema';

// Load environment variables
config();

async function addSampleData() {
  try {
    console.log('🌱 Adding sample data...\n');

    // Add sample exams
    console.log('1. Adding sample exams...');
    const [sscCgl] = await db.insert(exams).values({
      examName: 'SSC CGL',
      examCode: 'SSC_CGL',
      description: 'Staff Selection Commission Combined Graduate Level',
      examPattern: 'Tier 1: Objective Type, Tier 2: Descriptive Type',
      totalMarks: 200,
      durationMinutes: 60,
      negativeMarking: true,
      negativeMarksRatio: 0.25,
    }).returning();

    const [rrbNtpc] = await db.insert(exams).values({
      examName: 'RRB NTPC',
      examCode: 'RRB_NTPC',
      description: 'Railway Recruitment Board Non-Technical Popular Categories',
      examPattern: 'CBT 1 & CBT 2',
      totalMarks: 100,
      durationMinutes: 90,
      negativeMarking: true,
      negativeMarksRatio: 0.25,
    }).returning();

    console.log('✅ Exams added:', sscCgl.examName, rrbNtpc.examName);

    // Add subjects for SSC CGL
    console.log('\n2. Adding subjects for SSC CGL...');
    const [qaSubject] = await db.insert(subjects).values({
      examId: sscCgl.examId,
      subjectName: 'Quantitative Aptitude',
      subjectCode: 'QA',
      weightagePercentage: 25.0,
      totalQuestions: 25,
      displayOrder: 1,
    }).returning();

    const [reasoningSubject] = await db.insert(subjects).values({
      examId: sscCgl.examId,
      subjectName: 'General Intelligence & Reasoning',
      subjectCode: 'GIR',
      weightagePercentage: 25.0,
      totalQuestions: 25,
      displayOrder: 2,
    }).returning();

    const [gaSubject] = await db.insert(subjects).values({
      examId: sscCgl.examId,
      subjectName: 'General Awareness',
      subjectCode: 'GA',
      weightagePercentage: 25.0,
      totalQuestions: 25,
      displayOrder: 3,
    }).returning();

    const [englishSubject] = await db.insert(subjects).values({
      examId: sscCgl.examId,
      subjectName: 'English Language',
      subjectCode: 'ENG',
      weightagePercentage: 25.0,
      totalQuestions: 25,
      displayOrder: 4,
    }).returning();

    console.log('✅ Subjects added for SSC CGL');

    // Add topics for Quantitative Aptitude
    console.log('\n3. Adding topics for Quantitative Aptitude...');
    const [numberSystemTopic] = await db.insert(topics).values({
      subjectId: qaSubject.subjectId,
      topicName: 'Number System',
      difficultyLevel: 'medium',
      estimatedTimeMinutes: 30,
      displayOrder: 1,
    }).returning();

    const [algebraTopic] = await db.insert(topics).values({
      subjectId: qaSubject.subjectId,
      topicName: 'Algebra',
      difficultyLevel: 'hard',
      estimatedTimeMinutes: 45,
      displayOrder: 2,
    }).returning();

    const [geometryTopic] = await db.insert(topics).values({
      subjectId: qaSubject.subjectId,
      topicName: 'Geometry',
      difficultyLevel: 'medium',
      estimatedTimeMinutes: 40,
      displayOrder: 3,
    }).returning();

    console.log('✅ Topics added for Quantitative Aptitude');

    // Add sample questions
    console.log('\n4. Adding sample questions...');
    await db.insert(questions).values({
      topicId: numberSystemTopic.topicId,
      subjectId: qaSubject.subjectId,
      examId: sscCgl.examId,
      questionText: 'What is the value of 2^3 + 3^2?',
      questionType: 'mcq',
      difficultyLevel: 'easy',
      marks: 1.0,
      negativeMarks: 0.25,
      optionA: '15',
      optionB: '17',
      optionC: '19',
      optionD: '21',
      correctAnswer: 'B',
      detailedSolution: '2^3 = 8, 3^2 = 9, so 8 + 9 = 17',
      hint: 'Calculate powers first, then add',
      yearAppeared: 2023,
      source: 'Previous Year Paper',
      language: 'en',
    });

    await db.insert(questions).values({
      topicId: numberSystemTopic.topicId,
      subjectId: qaSubject.subjectId,
      examId: sscCgl.examId,
      questionText: 'Find the LCM of 12 and 18.',
      questionType: 'mcq',
      difficultyLevel: 'medium',
      marks: 1.0,
      negativeMarks: 0.25,
      optionA: '24',
      optionB: '36',
      optionC: '48',
      optionD: '72',
      correctAnswer: 'B',
      detailedSolution: 'LCM of 12 and 18 = 36',
      hint: 'Find the smallest number divisible by both',
      yearAppeared: 2023,
      source: 'Previous Year Paper',
      language: 'en',
    });

    await db.insert(questions).values({
      topicId: algebraTopic.topicId,
      subjectId: qaSubject.subjectId,
      examId: sscCgl.examId,
      questionText: 'If x + y = 10 and x - y = 4, what is the value of x?',
      questionType: 'mcq',
      difficultyLevel: 'medium',
      marks: 1.0,
      negativeMarks: 0.25,
      optionA: '6',
      optionB: '7',
      optionC: '8',
      optionD: '9',
      correctAnswer: 'B',
      detailedSolution: 'Adding both equations: 2x = 14, so x = 7',
      hint: 'Add the two equations to eliminate y',
      yearAppeared: 2023,
      source: 'Previous Year Paper',
      language: 'en',
    });

    console.log('✅ Sample questions added');

    console.log('\n🎉 Sample data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Exams: 2 (SSC CGL, RRB NTPC)`);
    console.log(`   - Subjects: 4 (for SSC CGL)`);
    console.log(`   - Topics: 3 (for Quantitative Aptitude)`);
    console.log(`   - Questions: 3 (sample questions)`);

  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }

  process.exit(0);
}

// Only run if this file is executed directly
if (require.main === module) {
  addSampleData();
}

