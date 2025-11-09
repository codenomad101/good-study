import 'dotenv/config';
import postgres from 'postgres';

const expectedMappings: Record<string, string> = {
  'aptitude-2025-11-08.json': 'aptitude',
  'agri-2025-11-08.json': 'agriculture',
  'Economy-2025-11-08.json': 'economy',
  'Englis_2025-11-08.json': 'english',
  'geographyEnglish_2025-11-10.json': 'geography',
  'GKEnglish_2025-11-10.json': 'gk',
  'HistoryEnglish_2025-11-10.json': 'history',
  'Polity-2025-11-10.json': 'polity',
  'Science-2025-11-08.json': 'science',
  'currentAffaris-2025-08-08.json': 'current-affairs',
  'Marathi-2025-11-08.json': 'marathi',
};

async function findCategoryId(sql: any, categorySlug: string): Promise<string | null> {
  const exactMatch = await sql/*sql*/`
    select category_id, slug, name 
    from practice_categories 
    where slug = ${categorySlug} 
    limit 1
  ` as any[];
  
  if (exactMatch.length > 0) {
    return exactMatch[0].category_id;
  }
  
  return null;
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  
  try {
    console.log('🔧 Fixing category assignments for dated files...\n');
    
    // Get all questions from dated files with their current categories
    const currentAssignments = await sql/*sql*/`
      select 
        pq.question_id,
        pq.source,
        pc.slug as current_slug,
        pc.category_id as current_category_id
      from practice_questions pq
      join practice_categories pc on pq.category_id = pc.category_id
      where pq.source like '%2025%'
    ` as any[];
    
    if (currentAssignments.length === 0) {
      console.log('⚠️  No dated files found in database');
      return;
    }
    
    console.log(`📝 Found ${currentAssignments.length} questions from dated files\n`);
    
    let fixed = 0;
    let alreadyCorrect = 0;
    let failed = 0;
    
    for (const assignment of currentAssignments) {
      const fileName = assignment.source;
      const expectedSlug = expectedMappings[fileName];
      
      if (!expectedSlug) {
        console.log(`⚠️  No mapping defined for: ${fileName}`);
        continue;
      }
      
      if (assignment.current_slug === expectedSlug) {
        alreadyCorrect++;
        continue;
      }
      
      // Find the correct category
      const correctCategoryId = await findCategoryId(sql, expectedSlug);
      if (!correctCategoryId) {
        console.log(`❌ Category '${expectedSlug}' not found for file: ${fileName}`);
        failed++;
        continue;
      }
      
      // Update the question's category
      try {
        await sql/*sql*/`
          update practice_questions
          set category_id = ${correctCategoryId},
              updated_at = now()
          where question_id = ${assignment.question_id}
        `;
        fixed++;
      } catch (error) {
        console.error(`❌ Failed to update question ${assignment.question_id}:`, error);
        failed++;
      }
    }
    
    // Update category counts
    console.log('\n📊 Updating category question counts...');
    const allCategories = await sql/*sql*/`
      select category_id from practice_categories
    ` as any[];
    
    for (const cat of allCategories) {
      const [{ count }] = await sql/*sql*/`
        select count(*)::int as count 
        from practice_questions 
        where category_id = ${cat.category_id}
      ` as any;
      
      await sql/*sql*/`
        update practice_categories 
        set total_questions = ${count}, updated_at = now() 
        where category_id = ${cat.category_id}
      `;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Fix Summary:');
    console.log(`   ✅ Fixed: ${fixed} questions`);
    console.log(`   ✓ Already correct: ${alreadyCorrect} questions`);
    console.log(`   ❌ Failed: ${failed} questions`);
    console.log('='.repeat(60));
    console.log('\n🎉 Category reassignment completed!');
    
  } catch (error) {
    console.error('❌ Error fixing categories:', error);
    process.exit(1);
  } finally {
    // @ts-ignore
    await (sql as any).end({ timeout: 1 });
  }
}

main().catch((e) => { 
  console.error(e); 
  process.exit(1); 
});

