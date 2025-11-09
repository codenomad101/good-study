import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

type Option = { id: number; text: string };

// Map file paths/directories to category slugs
const categoryMapping: Record<string, string> = {
  'currentAffairs': 'current-affairs',
  'current-affairs': 'current-affairs',
  'currentaffairs': 'current-affairs',
  'gk': 'gk',
  'economy': 'economy',
  'history': 'history',
  'geography': 'geography',
  'english': 'english',
  'aptitude': 'aptitude',
  'polity': 'polity',
  'science': 'science',
  'agri': 'agriculture',
  'agriculture': 'agriculture',
  'marathi': 'marathi',
};

function normalizeOptions(opts: any): Option[] {
  if (!Array.isArray(opts)) return [];
  return opts.map((opt: any, idx: number) => {
    if (typeof opt === 'string') return { id: idx + 1, text: opt };
    if (opt && typeof opt === 'object') return { id: opt.id || idx + 1, text: opt.text || opt.label || String(opt.value ?? '') };
    return { id: idx + 1, text: String(opt ?? '') };
  });
}

function extractCorrectOption(q: any, options: Option[]): { correctOption: number | null; correctAnswerText: string } {
  let correctOption: number | null = null;
  let correctAnswerText = '';

  if (q.correctOption != null) {
    const n = parseInt(String(q.correctOption));
    if (!isNaN(n)) correctOption = n;
  }
  const candidates = [q.Answer, q.CorrectAnswer, q.correctAnswer];
  for (const cand of candidates) {
    if (correctOption != null) break;
    if (typeof cand === 'string') {
      const m = cand.match(/Option\s*(\d+)/i);
      if (m) correctOption = parseInt(m[1]);
    }
  }
  if (correctOption == null && typeof q.CorrectAnswer === 'string' && options.length) {
    const found = options.find((o) => o.text.trim().toLowerCase() === String(q.CorrectAnswer).trim().toLowerCase());
    if (found) correctOption = found.id;
  }
  if (correctOption && options.length) {
    const opt = options.find((o) => o.id === correctOption);
    if (opt) correctAnswerText = opt.text;
  }
  if (!correctAnswerText && typeof q.CorrectAnswer === 'string') correctAnswerText = q.CorrectAnswer;
  return { correctOption, correctAnswerText };
}

function readJsonArray(filePath: string): any[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('JSON file should contain an array');
  return data;
}

function findCategorySlug(filePath: string): string | null {
  const normalizedPath = filePath.toLowerCase();
  const pathParts = filePath.split(path.sep);
  
  // Check directory names
  for (const part of pathParts) {
    const normalizedPart = part.toLowerCase();
    if (categoryMapping[normalizedPart]) {
      return categoryMapping[normalizedPart];
    }
  }
  
  // Check filename for category keywords
  const fileName = path.basename(filePath).toLowerCase();
  for (const [key, slug] of Object.entries(categoryMapping)) {
    if (fileName.includes(key)) {
      return slug;
    }
  }
  
  return null;
}

async function findCategoryId(sql: any, categorySlug: string): Promise<string | null> {
  // Try exact slug match first
  const exactMatch = await sql/*sql*/`
    select category_id, slug, name 
    from practice_categories 
    where slug = ${categorySlug} 
    limit 1
  ` as any[];
  
  if (exactMatch.length > 0) {
    return exactMatch[0].category_id;
  }
  
  // Try name match
  const nameMatch = await sql/*sql*/`
    select category_id, slug, name 
    from practice_categories 
    where lower(name) = ${categorySlug.replace('-', ' ')} 
    limit 1
  ` as any[];
  
  if (nameMatch.length > 0) {
    return nameMatch[0].category_id;
  }
  
  // Try partial match
  const partialMatch = await sql/*sql*/`
    select category_id, slug, name 
    from practice_categories 
    where slug like ${`%${categorySlug}%`} or lower(name) like ${`%${categorySlug}%`}
    limit 1
  ` as any[];
  
  if (partialMatch.length > 0) {
    return partialMatch[0].category_id;
  }
  
  return null;
}

async function importFile(sql: any, filePath: string, categorySlug: string) {
  try {
    console.log(`\n📄 Processing: ${filePath}`);
    console.log(`   Category: ${categorySlug}`);
    
    const categoryId = await findCategoryId(sql, categorySlug);
    if (!categoryId) {
      console.log(`   ⚠️  Category '${categorySlug}' not found in database. Skipping...`);
      return { inserted: 0, skipped: 0, failed: 0 };
    }
    
    console.log(`   ✅ Found category ID: ${categoryId}`);
    
    const arr = readJsonArray(filePath);
    console.log(`   📝 Found ${arr.length} questions in file`);
    
    let inserted = 0, skipped = 0, failed = 0;
    
    for (const q of arr) {
      const questionText = q.Question || q.question || '';
      if (!questionText) { 
        skipped++; 
        continue; 
      }
      
      const options = normalizeOptions(q.Options || q.options);
      if (options.length === 0) {
        skipped++;
        continue;
      }
      
      const { correctOption, correctAnswerText } = extractCorrectOption(q, options);
      if (!correctAnswerText) {
        skipped++;
        continue;
      }
      
      const explanation = q.Explanation || q.explanation || '';
      
      // Check if question already exists
      const exists = await sql/*sql*/`
        select question_id 
        from practice_questions 
        where category_id = ${categoryId} 
        and question_text = ${questionText} 
        limit 1
      ` as any[];
      
      if (exists.length > 0) { 
        skipped++; 
        continue; 
      }
      
      try {
        const topicRaw = (q.topic || '').toString().trim();
        const difficulty = String(q.Difficulty || q.difficulty || 'medium').toLowerCase();
        const jobArray = q.Job 
          ? (Array.isArray(q.Job) ? q.Job : String(q.Job).split(',').map((s: string) => s.trim()))
          : [];
        
        await sql/*sql*/`
          insert into practice_questions (
            category_id, question_text, options, correct_answer, correct_option, explanation,
            difficulty, marks, question_type, job, original_category, source, status, topic
          ) values (
            ${categoryId}, 
            ${questionText}, 
            ${JSON.stringify(options)}, 
            ${correctAnswerText}, 
            ${correctOption}, 
            ${explanation},
            ${difficulty}, 
            ${q.marks || 1}, 
            'mcq', 
            ${JSON.stringify(jobArray)},
            ${q.category || categorySlug}, 
            ${path.basename(filePath)}, 
            'active', 
            ${topicRaw || null}
          )
        `;
        inserted++;
      } catch (e) {
        failed++;
        console.error(`   ❌ Failed to insert question: ${(e as Error).message.substring(0, 100)}`);
      }
    }
    
    // Update category question count
    const [{ count }] = await sql/*sql*/`
      select count(*)::int as count 
      from practice_questions 
      where category_id = ${categoryId}
    ` as any;
    
    await sql/*sql*/`
      update practice_categories 
      set total_questions = ${count}, updated_at = now() 
      where category_id = ${categoryId}
    `;
    
    console.log(`   ✅ Imported: ${inserted} inserted, ${skipped} skipped, ${failed} failed. Category total: ${count}`);
    
    return { inserted, skipped, failed };
  } catch (error) {
    console.error(`   ❌ Error processing file ${filePath}:`, error);
    return { inserted: 0, skipped: 0, failed: 0 };
  }
}

async function findDatedQuestionFiles(baseDir: string): Promise<string[]> {
  const files: string[] = [];
  
  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.includes('2025') && entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(baseDir);
  return files;
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  
  try {
    console.log('🚀 Starting import of dated question files...\n');
    
    const baseDir = path.resolve(process.cwd(), 'data');
    const files = await findDatedQuestionFiles(baseDir);
    
    if (files.length === 0) {
      console.log('⚠️  No dated question files (containing "2025") found in data directory');
      return;
    }
    
    console.log(`📁 Found ${files.length} dated question file(s):\n`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log('');
    
    let totalInserted = 0, totalSkipped = 0, totalFailed = 0;
    
    for (const filePath of files) {
      const categorySlug = findCategorySlug(filePath);
      
      if (!categorySlug) {
        console.log(`\n⚠️  Could not determine category for: ${filePath}`);
        console.log(`   Skipping this file...`);
        continue;
      }
      
      const result = await importFile(sql, filePath, categorySlug);
      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      totalFailed += result.failed;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary:');
    console.log(`   ✅ Inserted: ${totalInserted}`);
    console.log(`   ⏭️  Skipped: ${totalSkipped}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📁 Files processed: ${files.length}`);
    console.log('='.repeat(60));
    console.log('\n🎉 Import completed!');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
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

