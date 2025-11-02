import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

type Option = { id: number; text: string };

function normalizeOptions(opts: any): Option[] {
  if (!Array.isArray(opts)) return [];
  return opts.map((opt: any, idx: number) => {
    if (typeof opt === 'string') return { id: idx + 1, text: opt };
    if (opt && typeof opt === 'object') return { id: opt.id || idx + 1, text: opt.text || opt.label || String(opt.value ?? '') };
    return { id: idx + 1, text: String(opt ?? '') };
  });
}

function extractCorrectOptionAndText(q: any, options: Option[]): { correctOption: number | null; correctAnswerText: string } {
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
  if (!Array.isArray(data)) throw new Error(`JSON file is not an array: ${filePath}`);
  return data;
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const categoryToFile: Array<{ slug: string; file: string; display: string }> = [
      { slug: 'gk', file: 'data/English/GKEnglish.json', display: 'General Knowledge' },
      { slug: 'history', file: 'data/English/historyEnglish.json', display: 'History' },
      { slug: 'geography', file: 'data/English/geographyEnglish.json', display: 'Geography' },
      { slug: 'english', file: 'data/English/englishGrammer.json', display: 'English' },
      { slug: 'aptitude', file: 'data/English/AptitudeEnglish.json', display: 'Aptitude' },
      { slug: 'agriculture', file: 'data/English/agricultureEnglish.json', display: 'Agriculture' },
      { slug: 'marathi', file: 'data/Marathi/grammerMarathi.json', display: 'Marathi' },
    ];

    for (const { slug, file, display } of categoryToFile) {
      const cats = await sql/*sql*/`select category_id from practice_categories where slug = ${slug} limit 1` as any[];
      if (!cats || cats.length === 0) {
        console.log(`Skipping '${slug}' — category not found`);
        continue;
      }
      const categoryId = cats[0].category_id as string;

      const filePath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        console.log(`File missing for '${slug}': ${file}`);
        continue;
      }

      const questions = readJsonArray(filePath);
      let inserted = 0, skipped = 0, failed = 0;
      for (const q of questions) {
        const questionText = q.Question || q.question || '';
        if (!questionText) { skipped++; continue; }
        const options = normalizeOptions(q.Options || q.options);
        const { correctOption, correctAnswerText } = extractCorrectOptionAndText(q, options);
        const explanation = q.Explanation || q.explanation || '';

        // Deduplicate within category by exact question text
        const exists = await sql/*sql*/`select question_id from practice_questions where category_id = ${categoryId} and question_text = ${questionText} limit 1` as any[];
        if (exists.length > 0) { skipped++; continue; }

        try {
          await sql/*sql*/`
            insert into practice_questions (
              category_id, question_text, options, correct_answer, correct_option, explanation,
              difficulty, marks, question_type, job, original_category, source, status, topic
            ) values (
              ${categoryId}, ${questionText}, ${JSON.stringify(options)}, ${correctAnswerText}, ${correctOption}, ${explanation},
              ${String(q.Difficulty || q.difficulty || 'medium').toLowerCase()}, ${q.marks || 1}, 'mcq', ${JSON.stringify(q.Job ? (Array.isArray(q.Job) ? q.Job : String(q.Job).split(',').map((s: string) => s.trim())) : [])},
              ${q.category || display}, ${path.basename(filePath)}, 'active', ${null}
            )
          `;
          inserted++;
        } catch (e) {
          failed++;
          console.error(`Failed to insert '${slug}' question:`, (e as Error).message);
        }
      }

      // Update count for this category
      const [{ count }] = await sql/*sql*/`select count(*)::int as count from practice_questions where category_id = ${categoryId}` as any;
      await sql/*sql*/`update practice_categories set total_questions = ${count}, updated_at = now() where category_id = ${categoryId}`;
      console.log(`'${slug}' (${display}): inserted=${inserted}, skipped=${skipped}, failed=${failed}. total now=${count}`);
    }

    console.log('Core categories import completed.');
  } finally {
    // @ts-ignore
    await (sql as any).end({ timeout: 1 });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


