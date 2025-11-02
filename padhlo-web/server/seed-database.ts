import { db } from './src/db';
import { practiceCategories, practiceQuestions, NewPracticeCategory, NewPracticeQuestion } from './src/db/schema';
import fs from 'fs';
import path from 'path';

// Categories based on existing data files
const existingCategories: NewPracticeCategory[] = [
  {
    name: 'Economy',
    description: 'Economic concepts and current affairs',
    slug: 'economy',
    color: '#3b82f6',
    language: 'en',
    timeLimitMinutes: 15,
    questionsPerSession: 20,
    sortOrder: 1,
    status: 'active'
  },
  {
    name: 'General Knowledge',
    description: 'General awareness and current events',
    slug: 'gk',
    color: '#10b981',
    language: 'en',
    timeLimitMinutes: 15,
    questionsPerSession: 20,
    sortOrder: 2,
    status: 'active'
  },
  {
    name: 'History',
    description: 'Indian and world history',
    slug: 'history',
    color: '#f59e0b',
    language: 'en',
    timeLimitMinutes: 15,
    questionsPerSession: 20,
    sortOrder: 3,
    status: 'active'
  },
  {
    name: 'Geography',
    description: 'Physical and human geography',
    slug: 'geography',
    color: '#8b5cf6',
    language: 'en',
    timeLimitMinutes: 15,
    questionsPerSession: 20,
    sortOrder: 4,
    status: 'active'
  },
  {
    name: 'English',
    description: 'Grammar and language skills',
    slug: 'english',
    color: '#ec4899',
    language: 'en',
    timeLimitMinutes: 15,
    questionsPerSession: 20,
    sortOrder: 5,
    status: 'active'
  },
  {
    name: 'Aptitude',
    description: 'Quantitative and logical reasoning',
    slug: 'aptitude',
    color: '#06b6d4',
    language: 'en',
    timeLimitMinutes: 15,
    questionsPerSession: 20,
    sortOrder: 6,
    status: 'active'
  },
  {
    name: 'Agriculture',
    description: 'Agricultural science and practices',
    slug: 'agriculture',
    color: '#84cc16',
    language: 'en',
    timeLimitMinutes: 15,
    questionsPerSession: 20,
    sortOrder: 7,
    status: 'active'
  },
  {
    name: 'Marathi',
    description: 'Marathi language and literature',
    slug: 'marathi',
    color: '#f97316',
    language: 'mr',
    timeLimitMinutes: 15,
    questionsPerSession: 20,
    sortOrder: 8,
    status: 'active'
  }
];

// JSON file mapping
const jsonFileMapping = [
  { categorySlug: 'economy', filePath: '../Padhlo/data/English/economyEnglish.json' },
  { categorySlug: 'gk', filePath: '../Padhlo/data/English/GKEnglish.json' },
  { categorySlug: 'history', filePath: '../Padhlo/data/English/historyEnglish.json' },
  { categorySlug: 'geography', filePath: '../Padhlo/data/English/geographyEnglish.json' },
  { categorySlug: 'english', filePath: '../Padhlo/data/English/englishGrammer.json' },
  { categorySlug: 'aptitude', filePath: '../Padhlo/data/English/AptitudeEnglish.json' },
  { categorySlug: 'agriculture', filePath: '../Padhlo/data/English/agricultureEnglish.json' },
  { categorySlug: 'marathi', filePath: '../Padhlo/data/Marathi/grammerMarathi.json' }
];

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories...');
    
    const createdCategories: { [key: string]: string } = {};
    
    for (const category of existingCategories) {
      const [createdCategory] = await db.insert(practiceCategories).values(category).returning();
      createdCategories[category.slug] = createdCategory.categoryId;
      console.log(`✅ Created category: ${category.name} (${category.slug})`);
    }
    
    return createdCategories;
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
}

async function importQuestionsFromJson(categorySlug: string, categoryId: string, filePath: string) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return 0;
    }

    console.log(`📄 Reading file: ${filePath}`);
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const questionsData = JSON.parse(fileContent);

    if (!Array.isArray(questionsData)) {
      console.log(`⚠️  Invalid JSON format in ${filePath}`);
      return 0;
    }

    console.log(`📝 Processing ${questionsData.length} questions from ${categorySlug}...`);
    
    let importedCount = 0;
    let skippedCount = 0;

    for (const questionData of questionsData) {
      try {
        // Validate question data
        if (!questionData.Question || !questionData.Options || !questionData.CorrectAnswer) {
          skippedCount++;
          continue;
        }

        const newQuestion: NewPracticeQuestion = {
          categoryId,
          questionText: questionData.Question,
          options: questionData.Options,
          correctAnswer: questionData.CorrectAnswer,
          explanation: questionData.Explanation || '',
          originalCategory: questionData.category || categorySlug,
          source: 'json_import',
          difficulty: questionData.Difficulty || 'medium',
          job: questionData.Job || [],
          marks: 1,
          questionType: 'mcq',
          status: 'active'
        };

        await db.insert(practiceQuestions).values(newQuestion);
        importedCount++;

      } catch (error) {
        console.error(`❌ Error importing question:`, error);
        skippedCount++;
      }
    }

    // Update category question count
    await db
      .update(practiceCategories)
      .set({
        totalQuestions: importedCount,
        updatedAt: new Date()
      })
      .where(eq(practiceCategories.categoryId, categoryId));

    console.log(`✅ Imported ${importedCount} questions, skipped ${skippedCount} from ${categorySlug}`);
    return importedCount;

  } catch (error) {
    console.error(`❌ Error importing questions from ${filePath}:`, error);
    return 0;
  }
}

async function seedDatabase() {
  try {
    console.log('🚀 Starting database seeding...\n');
    
    // Step 1: Seed categories
    const createdCategories = await seedCategories();
    console.log('\n');
    
    // Step 2: Import questions from JSON files
    console.log('📚 Importing questions from JSON files...\n');
    
    let totalImported = 0;
    
    for (const mapping of jsonFileMapping) {
      const categoryId = createdCategories[mapping.categorySlug];
      if (categoryId) {
        const imported = await importQuestionsFromJson(
          mapping.categorySlug, 
          categoryId, 
          mapping.filePath
        );
        totalImported += imported;
      }
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`📊 Total questions imported: ${totalImported}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Visit http://localhost:5173/admin to access admin panel');
    console.log('   2. Check categories and questions in the admin interface');
    console.log('   3. Test practice sessions with the imported data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Import eq for the update query
import { eq } from 'drizzle-orm';

seedDatabase();
