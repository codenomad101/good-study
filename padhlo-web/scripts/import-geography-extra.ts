import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

function normalizeOptions(opts: any): Array<{ id: number; text: string }> {
  if (!Array.isArray(opts)) return [];
  return opts.map((opt: any, idx: number) => {
    if (typeof opt === 'string') return { id: idx + 1, text: opt };
    if (opt && typeof opt === 'object') return { id: opt.id || idx + 1, text: opt.text || opt.label || String(opt.value ?? '') };
    return { id: idx + 1, text: String(opt ?? '') };
  });
}

function extractCorrectOption(q: any, options: Array<{ id: number; text: string }>): { correctOption: number | null; correctAnswerText: string } {
  let correctOption: number | null = null;
  let correctAnswerText = '';

  if (q.correctOption) {
    const n = parseInt(String(q.correctOption));
    if (!isNaN(n)) correctOption = n;
  }
  if (correctOption == null && typeof q.Answer === 'string') {
    const m = q.Answer.match(/Option\s*(\d+)/i);
    if (m) correctOption = parseInt(m[1]);
  }
  if (correctOption == null && typeof q.CorrectAnswer === 'string') {
    const m = q.CorrectAnswer.match(/Option\s*(\d+)/i);
    if (m) correctOption = parseInt(m[1]);
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

function inferTopicSlug(question: string, explanation: string): string | undefined {
  const t = `${question} ${explanation}`.toLowerCase();
  if (/(himalaya|western ghats|eastern ghats|plateau|delta|peninsula|physiograph|mountain|peak|kalsubai|deccan)/.test(t)) return 'physical';
  if (/(monsoon|climate|rainfall|cyclone|wind|el nino|la nina|itcz|koppen|temperature)/.test(t)) return 'climatology';
  if (/(river|drainage|tributary|confluence|godavari|krishna|ganga|yamuna|narmada|tapi|jhelum|valley)/.test(t)) return 'rivers';
  if (/(ocean|current|tide|coral|gulf stream|elnino|la nina)/.test(t)) return 'oceanography';
  if (/(soil|regur|black cotton|laterite|alluvial|red soil|salinity)/.test(t)) return 'soils';
  if (/(population|urban|rural|demograph|migration|census|density)/.test(t)) return 'human';
  if (/(industry|industrial|transport|port|sez|economic geography|mineral|coal|manganese)/.test(t)) return 'economic-geography';
  if (/(vegetation|forest|wildlife|national park|sanctuary|biosphere)/.test(t)) return 'natural-vegetation-wildlife';
  if (/(map|topo|projection|remote sensing|gis)/.test(t)) return 'remote-sensing-gis';
  if (/(disaster|earthquake|flood|cyclone warning|tsunami)/.test(t)) return 'disaster-management';
  if (/(maharashtra)/.test(t)) return 'maharashtra-physical';
  return undefined;
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  const cats = await sql/*sql*/`select category_id from practice_categories where slug = 'geography' limit 1`;
  if (!cats || (cats as any[]).length === 0) throw new Error('Geography category not found. Seed categories first.');
  const categoryId = (cats as any[])[0].category_id as string;

  const candidates = [
    path.resolve(process.cwd(), 'data/English/georaphyExtra.json'),
    path.resolve(process.cwd(), 'data/English/geographyExtra.json'),
    path.resolve(process.cwd(), 'data/geographyExtra.json'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) throw new Error('geographyExtra.json not found.');

  const raw = fs.readFileSync(filePath, 'utf-8');
  let arr: any[] = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error('Invalid JSON: expected an array');

  let inserted = 0, skipped = 0;
  for (const q of arr) {
    const questionText = q.Question || q.question || '';
    if (!questionText) { skipped++; continue; }
    const options = normalizeOptions(q.Options);
    const { correctOption, correctAnswerText } = extractCorrectOption(q, options);
    const explanation = q.Explanation || q.explanation || '';
    const inferredTopic = inferTopicSlug(questionText, explanation);
    const topicSlug = q.topic ? String(q.topic).toLowerCase() : inferredTopic;

    // dedupe by question text
    const exists = await sql/*sql*/`select question_id from practice_questions where category_id = ${categoryId} and question_text = ${questionText} limit 1`;
    if ((exists as any[]).length > 0) { skipped++; continue; }

    await sql/*sql*/`
      insert into practice_questions (
        category_id, question_text, options, correct_answer, correct_option, explanation,
        difficulty, marks, question_type, job, original_category, source, status, topic
      ) values (
        ${categoryId}, ${questionText}, ${JSON.stringify(options)}, ${correctAnswerText}, ${correctOption}, ${explanation},
        ${String(q.Difficulty || 'medium').toLowerCase()}, ${q.marks || 1}, 'mcq', ${JSON.stringify(q.Job ? (Array.isArray(q.Job) ? q.Job : String(q.Job).split(',').map((s: string) => s.trim())) : [])},
        ${q.category || 'Geography'}, ${path.basename(filePath)}, 'active', ${topicSlug || null}
      )
    `;

    inserted++;
  }

  await sql.end({ timeout: 1 });
  console.log(`Imported geography questions. inserted=${inserted}, skipped=${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });


