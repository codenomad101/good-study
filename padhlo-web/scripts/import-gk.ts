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

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const cats = await sql/*sql*/`select category_id, slug from practice_categories where slug = 'gk' or lower(name) = 'general knowledge' limit 1` as any[];
    if (!cats || cats.length === 0) throw new Error("GK category not found. Ensure slug is 'gk' or name 'General Knowledge'.");
    const categoryId = cats[0].category_id as string;

    const candidates = [
      path.resolve(process.cwd(), 'data/English/gk/gkEnglish.json'),
      path.resolve(process.cwd(), 'data/English/GKEnglish.json'),
      path.resolve(process.cwd(), 'data/GKEnglish.json'),
    ];
    const filePath = candidates.find((p) => fs.existsSync(p));
    if (!filePath) throw new Error('gkEnglish.json not found.');

    const arr = readJsonArray(filePath);

    let inserted = 0, skipped = 0, failed = 0;
    for (const q of arr) {
      const questionText = q.Question || q.question || '';
      if (!questionText) { skipped++; continue; }

      const options = normalizeOptions(q.Options || q.options);
      const { correctOption, correctAnswerText } = extractCorrectOption(q, options);
      const explanation = q.Explanation || q.explanation || '';

      const exists = await sql/*sql*/`select question_id from practice_questions where category_id = ${categoryId} and question_text = ${questionText} limit 1` as any[];
      if (exists.length > 0) { skipped++; continue; }

      try {
        const topicRaw = (q.topic || '').toString().trim();
        await sql/*sql*/`
          insert into practice_questions (
            category_id, question_text, options, correct_answer, correct_option, explanation,
            difficulty, marks, question_type, job, original_category, source, status, topic
          ) values (
            ${categoryId}, ${questionText}, ${JSON.stringify(options)}, ${correctAnswerText}, ${correctOption}, ${explanation},
            ${String(q.Difficulty || q.difficulty || 'medium').toLowerCase()}, ${q.marks || 1}, 'mcq', ${JSON.stringify(q.Job ? (Array.isArray(q.Job) ? q.Job : String(q.Job).split(',').map((s: string) => s.trim())) : [])},
            ${q.category || 'General Knowledge'}, ${path.basename(filePath)}, 'active', ${topicRaw || null}
          )
        `;
        inserted++;
      } catch (e) {
        failed++;
        console.error('Failed to insert question:', (e as Error).message);
      }
    }

    // Update category question count after import
    const [{ count }] = await sql/*sql*/`select count(*)::int as count from practice_questions where category_id = ${categoryId}` as any;
    await sql/*sql*/`update practice_categories set total_questions = ${count}, updated_at = now() where category_id = ${categoryId}`;

    console.log(`Imported GK questions. inserted=${inserted}, skipped=${skipped}, failed=${failed}. category total now=${count}`);
  } finally {
    // @ts-ignore
    await (sql as any).end({ timeout: 1 });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


