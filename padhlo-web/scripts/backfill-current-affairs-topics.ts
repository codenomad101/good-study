import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

type QA = {
  Question?: string;
  question?: string;
  topic?: string;
};

function readJsonArray(filePath: string): QA[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('JSON file should contain an array');
  return data;
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const cats = await sql/*sql*/`select category_id from practice_categories where slug = 'current-affairs' or lower(name) = 'current affairs' limit 1` as any[];
    if (!cats || cats.length === 0) throw new Error("Current Affairs category not found. Ensure slug is 'current-affairs' or name 'Current Affairs'.");
    const categoryId = cats[0].category_id as string;

    const candidates = [
      path.resolve(process.cwd(), 'data/English/currentAffairsEnglish.json'),
      path.resolve(process.cwd(), 'data/currentAffairsEnglish.json'),
    ];
    const filePath = candidates.find((p) => fs.existsSync(p));
    if (!filePath) throw new Error('currentAffairsEnglish.json not found.');

    const arr = readJsonArray(filePath);

    let updated = 0, skipped = 0, missing = 0;
    for (const q of arr) {
      const questionText = q.Question || q.question || '';
      const topicRaw = (q.topic || '').toString().trim();
      if (!questionText) { skipped++; continue; }

      const rows = await sql/*sql*/`select question_id, topic from practice_questions where category_id = ${categoryId} and question_text = ${questionText} limit 1` as any[];
      if (!rows.length) { missing++; continue; }
      const row = rows[0];
      if (row.topic && row.topic.length > 0) { skipped++; continue; }

      await sql/*sql*/`update practice_questions set topic = ${topicRaw || null}, updated_at = now() where question_id = ${row.question_id}`;
      updated++;
    }

    console.log(`Backfill complete. updated=${updated}, skipped=${skipped}, missing=${missing}`);
  } finally {
    // @ts-ignore
    await (sql as any).end({ timeout: 1 });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


