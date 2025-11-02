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

  // Numeric or string index 1..n
  if (q.correctOption != null) {
    const n = parseInt(String(q.correctOption));
    if (!isNaN(n)) correctOption = n;
  }
  // Texts like "Option 2"
  const candidates = [q.Answer, q.CorrectAnswer, q.correctAnswer];
  for (const cand of candidates) {
    if (correctOption != null) break;
    if (typeof cand === 'string') {
      const m = cand.match(/Option\s*(\d+)/i);
      if (m) correctOption = parseInt(m[1]);
    }
  }
  // Match by text if still unknown
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
  if (/(constituent assembly|drafting committee|ambedkar|nehru report|cabinet mission|cripps|objective resolution)/.test(t)) return 'making-of-the-constitution';
  if (/(preamble|justice|liberty|equality|fraternity|sovereign|secular|democratic|republic)/.test(t)) return 'preamble';
  if (/(fundamental right|article\s*32|right to equality|freedom of speech|duty)/.test(t)) return 'fundamental-rights-and-duties';
  if (/(directive principle|dpsp|article\s*36|state policy|gandhian|liberal)/.test(t)) return 'directive-principles-of-state-policy';
  if (/(president|vice-president|prime minister|council of ministers|attorney general)/.test(t)) return 'union-executive';
  if (/(parliament|loksabha|rajyasabha|speaker|joint sitting|money bill|article\s*110)/.test(t)) return 'union-legislature-parliament';
  if (/(governor|chief minister|advocate-general)/.test(t)) return 'state-executive';
  if (/(vidhan sabha|vidhan parishad|legislative council|mlc|mla)/.test(t)) return 'state-legislature';
  if (/(supreme court|high court|article\s*124|judicial review|basic structure|kesavananda)/.test(t)) return 'judiciary';
  if (/(federal|union list|state list|concurrent list|article\s*246|finance commission|inter-state)/.test(t)) return 'federal-system';
  if (/(panchayati raj|municipality|73rd|74th|gram sabha|urban local)/.test(t)) return 'local-government-73rd-74th-amendments';
  if (/(election commission|upsc|cag|psc|niti aayog|finance commission|cbi|cvc|nhri|nhrc)/.test(t)) return 'constitutional-and-non-constitutional-bodies';
  if (/(national emergency|president rule|financial emergency|article\s*352|356|360)/.test(t)) return 'emergency-provisions';
  if (/(amendment|article\s*368|basic structure)/.test(t)) return 'amendment-of-the-constitution';
  if (/(political party|anti-defection|tenth schedule|pressure group)/.test(t)) return 'political-parties-and-pressure-groups';
  if (/(rpa|representation of the people act|vvpats|electoral reforms|eci)/.test(t)) return 'electoral-process-and-reforms';
  if (/(governance|citizens' charter|rtia|nagrik adhikar|good governance)/.test(t)) return 'public-policy-and-governance';
  if (/(article\s*|schedule)/.test(t)) return 'important-articles-and-schedules';
  if (/(keshavananda|minerva mills|s r bommai|golaknath|shah bano|puttaswamy)/.test(t)) return 'landmark-judgements-of-the-supreme-court';
  if (/(vidhan sabha maharashtra|legislative council maharashtra|governor maharashtra)/.test(t)) return 'maharashtras-political-system';
  return undefined;
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
    const cats = await sql/*sql*/`select category_id from practice_categories where slug = 'polity' limit 1`;
    if (!cats || (cats as any[]).length === 0) throw new Error('Polity category not found.');
    const categoryId = (cats as any[])[0].category_id as string;

    const candidates = [
      path.resolve(process.cwd(), 'data/English/polityExtra.json'),
      path.resolve(process.cwd(), 'data/polityExtra.json'),
    ];
    const filePath = candidates.find((p) => fs.existsSync(p));
    if (!filePath) throw new Error('polityExtra.json not found.');

    const arr = readJsonArray(filePath);

    let inserted = 0, skipped = 0, failed = 0;
    for (const q of arr) {
      const questionText = q.Question || q.question || '';
      if (!questionText) { skipped++; continue; }

      const options = normalizeOptions(q.Options || q.options);
      const { correctOption, correctAnswerText } = extractCorrectOption(q, options);
      const explanation = q.Explanation || q.explanation || '';
      const topicSlug = (q.topic ? String(q.topic).toLowerCase() : inferTopicSlug(questionText, explanation)) || null;

      const exists = await sql/*sql*/`select question_id from practice_questions where category_id = ${categoryId} and question_text = ${questionText} limit 1`;
      if ((exists as any[]).length > 0) { skipped++; continue; }

      try {
        await sql/*sql*/`
          insert into practice_questions (
            category_id, question_text, options, correct_answer, correct_option, explanation,
            difficulty, marks, question_type, job, original_category, source, status, topic
          ) values (
            ${categoryId}, ${questionText}, ${JSON.stringify(options)}, ${correctAnswerText}, ${correctOption}, ${explanation},
            ${String(q.Difficulty || q.difficulty || 'medium').toLowerCase()}, ${q.marks || 1}, 'mcq', ${JSON.stringify(q.Job ? (Array.isArray(q.Job) ? q.Job : String(q.Job).split(',').map((s: string) => s.trim())) : [])},
            ${q.category || 'Polity'}, ${path.basename(filePath)}, 'active', ${topicSlug}
          )
        `;
        inserted++;
      } catch (e) {
        failed++;
        // eslint-disable-next-line no-console
        console.error('Failed to insert question:', (e as Error).message);
      }
    }

    // Update category question count after import
    const [{ count }] = await sql/*sql*/`select count(*)::int as count from practice_questions where category_id = ${categoryId}` as any;
    await sql/*sql*/`update practice_categories set total_questions = ${count}, updated_at = now() where category_id = ${categoryId}`;

    console.log(`Imported polity extra. inserted=${inserted}, skipped=${skipped}, failed=${failed}. category total now=${count}`);
  } finally {
    // close connection
    // @ts-ignore
    await (sql as any).end({ timeout: 1 });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


