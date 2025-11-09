import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  
  try {
    console.log('📊 Fetching question counts by category...\n');
    
    const results = await sql/*sql*/`
      select 
        pc.slug,
        pc.name,
        pc.total_questions as category_count,
        count(pq.question_id)::int as actual_count,
        count(case when pq.status = 'active' then 1 end)::int as active_count,
        count(case when pq.status = 'inactive' then 1 end)::int as inactive_count
      from practice_categories pc
      left join practice_questions pq on pc.category_id = pq.category_id
      group by pc.category_id, pc.slug, pc.name, pc.total_questions
      order by pc.name
    ` as any[];
    
    if (results.length === 0) {
      console.log('⚠️  No categories found in database');
      return;
    }
    
    console.log('='.repeat(80));
    console.log('📚 Question Counts by Category');
    console.log('='.repeat(80));
    console.log('');
    console.log(
      'Category'.padEnd(25) + 
      'Slug'.padEnd(20) + 
      'Category Count'.padEnd(18) + 
      'Actual Count'.padEnd(18) + 
      'Active'.padEnd(12) + 
      'Inactive'
    );
    console.log('-'.repeat(80));
    
    let totalCategoryCount = 0;
    let totalActualCount = 0;
    let totalActive = 0;
    let totalInactive = 0;
    
    for (const row of results) {
      const categoryName = (row.name || '').substring(0, 24);
      const slug = (row.slug || '').substring(0, 19);
      const categoryCount = row.category_count || 0;
      const actualCount = row.actual_count || 0;
      const activeCount = row.active_count || 0;
      const inactiveCount = row.inactive_count || 0;
      
      totalCategoryCount += categoryCount;
      totalActualCount += actualCount;
      totalActive += activeCount;
      totalInactive += inactiveCount;
      
      console.log(
        categoryName.padEnd(25) + 
        slug.padEnd(20) + 
        String(categoryCount).padEnd(18) + 
        String(actualCount).padEnd(18) + 
        String(activeCount).padEnd(12) + 
        String(inactiveCount)
      );
    }
    
    console.log('-'.repeat(80));
    console.log(
      'TOTAL'.padEnd(25) + 
      ''.padEnd(20) + 
      String(totalCategoryCount).padEnd(18) + 
      String(totalActualCount).padEnd(18) + 
      String(totalActive).padEnd(12) + 
      String(totalInactive)
    );
    console.log('='.repeat(80));
    console.log('');
    
    // Check for discrepancies
    const discrepancies = results.filter(r => (r.category_count || 0) !== (r.actual_count || 0));
    if (discrepancies.length > 0) {
      console.log('⚠️  Categories with count discrepancies:');
      for (const row of discrepancies) {
        console.log(`   - ${row.name}: Category count (${row.category_count}) ≠ Actual count (${row.actual_count})`);
      }
      console.log('');
    }
    
    // Show breakdown by source
    console.log('📦 Questions by Source:');
    const sourceBreakdown = await sql/*sql*/`
      select 
        source,
        count(*)::int as count
      from practice_questions
      where source is not null
      group by source
      order by count desc
    ` as any[];
    
    for (const row of sourceBreakdown) {
      console.log(`   - ${row.source || '(null)'}: ${row.count} questions`);
    }
    
    console.log('');
    console.log('✅ Summary complete!');
    
  } catch (error) {
    console.error('❌ Error fetching question counts:', error);
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

