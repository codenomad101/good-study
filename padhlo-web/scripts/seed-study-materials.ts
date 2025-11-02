import 'dotenv/config';
import postgres from 'postgres';

type TemplateFn = (topicName: string) => string;

const categoryTemplates: Record<string, TemplateFn> = {
  economy: (t) => `${t}: Key definitions, recent policy changes, and exam-favorite indicators. Include 2-3 data points (latest CPI/WPI, repo rate), and one applied example.`,
  geography: (t) => `${t}: Core concepts, processes, and Indian context. Add one map-tip and one frequently confused pair for quick revision.`,
  history: (t) => `${t}: Timeline with 3-5 milestones, major personalities, key provisions/outcomes, and one previous-year MCQ angle.`,
  gk: (t) => `${t}: 5 crisp bullets covering recent updates, bodies/venues, and static facts likely to be asked.`,
  english: (t) => `${t}: Rule summary, 3 common errors, and 3 practice examples with answers.`,
  marathi: (t) => `${t}: संकल्पना थोडक्यात, ३ महत्त्वाचे मुद्दे, आणि २ उदाहरणे.`,
  aptitude: (t) => `${t}: Formula sheet, pattern types, and 2 solved examples with step-by-step solution.`,
  agriculture: (t) => `${t}: Practical definition, best practices, scheme linkage (if any), and 2 field-level tips.`,
};

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const categories = await sql/*sql*/`select category_id, slug, name from practice_categories`;

  for (const c of categories as any[]) {
    const catSlug = c.slug as string;
    const categoryId = c.category_id as string;
    const tmpl = categoryTemplates[catSlug] || ((t: string) => `${t}: Key points, definitions, and a short example.`);

    // Load topics from DB
    const topics = await sql/*sql*/`select slug, name from practice_topics where category_id = ${categoryId} order by sort_order, name`;
    if (!topics || (topics as any[]).length === 0) continue;

    // Clear existing materials for idempotent seed
    await sql/*sql*/`delete from practice_study_materials where category_id = ${categoryId}`;

    for (const t of topics as any[]) {
      const topicSlug = t.slug as string;
      const topicName = t.name as string;
      const title = `${c.name}: ${topicName} — Concise Notes`;
      const content = tmpl(topicName);
      const tags = JSON.stringify([catSlug, topicSlug, topicName]);
      await sql/*sql*/`
        insert into practice_study_materials (category_id, topic_slug, title, content, tags)
        values (${categoryId}, ${topicSlug}, ${title}, ${content}, ${tags})
      `;
    }
    console.log(`Seeded study materials for ${c.name}`);
  }

  await sql.end({ timeout: 1 });
  console.log('Seeded study materials (concise notes) for all topics');
}

main().catch((e) => { console.error(e); process.exit(1); });

