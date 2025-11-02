// Script to clear practice questions and re-import with correctOption field
import { db } from './server/src/db/index.js';
import { practiceQuestions, practiceCategories } from './server/src/db/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function clearAndReimportData() {
  try {
    console.log('🗑️  Clearing existing practice questions...');
    
    // Clear all practice questions
    await db.delete(practiceQuestions);
    console.log('✅ Practice questions cleared');
    
    console.log('📁 Processing JSON files...');
    
    // List of JSON files to process
    const jsonFiles = [
      'data/English/agricultureEnglish.json',
      'data/English/AptitudeEnglish.json', 
      'data/English/economyEnglish.json',
      'data/English/englishGrammer.json',
      'data/English/geographyEnglish.json',
      'data/English/GKEnglish.json',
      'data/English/historyEnglish.json',
      'data/Marathi/grammerMarathi.json'
    ];
    
    let totalImported = 0;
    let totalErrors = 0;
    
    for (const filePath of jsonFiles) {
      try {
        console.log(`\n📄 Processing ${filePath}...`);
        
        // Read and parse JSON file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const questions = JSON.parse(fileContent);
        
        if (!Array.isArray(questions)) {
          console.error(`❌ Invalid format in ${filePath}: Expected array`);
          continue;
        }
        
        // Get or create category
        const categorySlug = getCategorySlugFromPath(filePath);
        let [category] = await db
          .select()
          .from(practiceCategories)
          .where(eq(practiceCategories.slug, categorySlug))
          .limit(1);
        
        if (!category) {
          console.log(`📝 Creating category: ${categorySlug}`);
          // Create category if it doesn't exist
          const [newCategory] = await db
            .insert(practiceCategories)
            .values({
              slug: categorySlug,
              name: getCategoryNameFromSlug(categorySlug),
              description: `Questions for ${getCategoryNameFromSlug(categorySlug)}`,
              totalQuestions: questions.length,
              questionsPerSession: 20,
              timeLimitMinutes: 15,
              status: 'active',
              sortOrder: 1
            })
            .returning();
          category = newCategory;
        }
        
        let importedCount = 0;
        let errorCount = 0;
        
        // Process each question
        for (const questionData of questions) {
          try {
            // Validate required fields
            if (!questionData.Question || !questionData.Options || !questionData.CorrectAnswer) {
              console.warn(`⚠️  Skipping question with missing required fields`);
              errorCount++;
              continue;
            }
            
            // Validate correctOption field
            if (!questionData.correctOption || questionData.correctOption < 1 || questionData.correctOption > 4) {
              console.warn(`⚠️  Skipping question with invalid correctOption: ${questionData.correctOption}`);
              errorCount++;
              continue;
            }
            
            // Insert question
            await db.insert(practiceQuestions).values({
              categoryId: category.categoryId,
              questionText: questionData.Question,
              options: questionData.Options,
              correctAnswer: questionData.CorrectAnswer,
              correctOption: questionData.correctOption,
              explanation: questionData.Explanation || '',
              difficulty: questionData.Difficulty || 'medium',
              job: questionData.Job || [],
              originalCategory: questionData.category || '',
              source: 'json_import',
              status: 'active'
            });
            
            importedCount++;
            
          } catch (questionError) {
            console.error(`❌ Error importing question:`, questionError.message);
            errorCount++;
          }
        }
        
        console.log(`✅ ${filePath}: Imported ${importedCount} questions, ${errorCount} errors`);
        totalImported += importedCount;
        totalErrors += errorCount;
        
      } catch (fileError) {
        console.error(`❌ Error processing ${filePath}:`, fileError.message);
        totalErrors++;
      }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`📊 Total imported: ${totalImported} questions`);
    console.log(`❌ Total errors: ${totalErrors}`);
    
  } catch (error) {
    console.error('❌ Error in clearAndReimportData:', error);
  } finally {
    process.exit(0);
  }
}

function getCategorySlugFromPath(filePath) {
  const filename = filePath.split('/').pop();
  if (filename.includes('agriculture')) return 'agriculture';
  if (filename.includes('Aptitude')) return 'aptitude';
  if (filename.includes('economy')) return 'economy';
  if (filename.includes('englishGrammer')) return 'english';
  if (filename.includes('geography')) return 'geography';
  if (filename.includes('GKEnglish')) return 'gk';
  if (filename.includes('history')) return 'history';
  if (filename.includes('grammerMarathi')) return 'marathi';
  return 'unknown';
}

function getCategoryNameFromSlug(slug) {
  const names = {
    'agriculture': 'Agriculture',
    'aptitude': 'Aptitude',
    'economy': 'Economy', 
    'english': 'English Grammar',
    'geography': 'Geography',
    'gk': 'General Knowledge',
    'history': 'History',
    'marathi': 'Marathi Grammar'
  };
  return names[slug] || slug;
}

// Run the script
clearAndReimportData();
