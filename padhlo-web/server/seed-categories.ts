import { db } from './src/db';
import { practiceCategories, NewPracticeCategory } from './src/db/schema';

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

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories from existing data...');
    
    for (const category of existingCategories) {
      await db.insert(practiceCategories).values(category);
      console.log(`✅ Created category: ${category.name} (${category.slug})`);
    }
    
    console.log('🎉 All categories seeded successfully!');
    console.log('📝 You can now:');
    console.log('   1. Access admin panel at http://localhost:5173/admin');
    console.log('   2. Import JSON files for each category');
    console.log('   3. Manage questions through the admin interface');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();


