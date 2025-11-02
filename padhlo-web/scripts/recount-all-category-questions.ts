import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    // Get all categories
    const categories = await sql/*sql*/`select category_id, slug, name from practice_categories` as any[];
    let updated = 0;

    for (const c of categories) {
      const [{ count }] = await sql/*sql*/`select count(*)::int as count from practice_questions where category_id = ${c.category_id}` as any;
      await sql/*sql*/`update practice_categories set total_questions = ${count}, updated_at = now() where category_id = ${c.category_id}`;
      // eslint-disable-next-line no-console
      console.log(`Updated ${c.slug} (${c.name}) -> ${count}`);
      updated++;
    }

    console.log(`Recount complete. Updated ${updated} categories.`);
  } finally {
    // @ts-ignore
    await (sql as any).end({ timeout: 1 });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


