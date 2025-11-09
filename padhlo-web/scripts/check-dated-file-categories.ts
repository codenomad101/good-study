import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  
  try {
    console.log('🔍 Checking category assignments for dated files (2025)...\n');
    
    const results = await sql/*sql*/`
      select 
        pq.source,
        pc.name as category_name,
        pc.slug,
        count(*)::int as count
      from practice_questions pq
      join practice_categories pc on pq.category_id = pc.category_id
      where pq.source like '%2025%'
      group by pq.source, pc.name, pc.slug
      order by pq.source
    ` as any[];
    
    if (results.length === 0) {
      console.log('⚠️  No dated files found in database');
      return;
    }
    
    console.log('='.repeat(90));
    console.log('📁 Dated Files Category Assignments');
    console.log('='.repeat(90));
    console.log('');
    console.log('File'.padEnd(45) + 'Current Category'.padEnd(25) + 'Count');
    console.log('-'.repeat(90));
    
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
    
    const issues: any[] = [];
    
    for (const row of results) {
      const fileName = row.source;
      const currentCategory = row.category_name;
      const currentSlug = row.slug;
      const expectedSlug = expectedMappings[fileName];
      
      const status = expectedSlug && expectedSlug !== currentSlug ? '❌ WRONG' : '✅';
      
      console.log(
        fileName.padEnd(45) + 
        `${currentCategory} (${currentSlug})`.padEnd(25) + 
        String(row.count).padEnd(10) +
        status
      );
      
      if (expectedSlug && expectedSlug !== currentSlug) {
        issues.push({
          fileName,
          currentCategory: currentSlug,
          expectedCategory: expectedSlug,
          count: row.count
        });
      }
    }
    
    console.log('-'.repeat(90));
    console.log('');
    
    if (issues.length > 0) {
      console.log('⚠️  Found misclassified files:');
      for (const issue of issues) {
        console.log(`   - ${issue.fileName}: Currently in '${issue.currentCategory}', should be in '${issue.expectedCategory}' (${issue.count} questions)`);
      }
      console.log('');
      console.log('💡 Run the fix script to correct these assignments.');
    } else {
      console.log('✅ All dated files are in the correct categories!');
    }
    
  } catch (error) {
    console.error('❌ Error checking categories:', error);
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

