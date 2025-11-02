import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    const rows = await sql/*sql*/`
      select slug, name, total_questions
      from practice_categories
      where slug in ('polity', 'current-affairs') or lower(name) in ('polity', 'current affairs')
      order by slug
    ` as any[];
    console.log('Matched categories:', rows);

    const all = await sql/*sql*/`select slug, name, total_questions from practice_categories order by name` as any[];
    console.log('All categories:', all);
  } finally {
    // @ts-ignore
    await (sql as any).end({ timeout: 1 });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


