import 'dotenv/config';
import postgres from 'postgres';

type TopicsBySlug = Record<string, string[]>;

// Topics per existing category slug
const topicsByCategory: TopicsBySlug = {
  polity: [
    'Making of the Constitution',
    'Preamble',
    'Fundamental Rights and Duties',
    'Directive Principles of State Policy',
    'Union Executive',
    'Union Legislature (Parliament)',
    'State Executive',
    'State Legislature',
    'Judiciary',
    'Federal System',
    'Local Government (73rd/74th Amendments)',
    'Constitutional and Non-Constitutional Bodies',
    'Emergency Provisions',
    'Amendment of the Constitution',
    'Political Parties and Pressure Groups',
    'Electoral Process and Reforms',
    'Public Policy and Governance',
    'Important Articles and Schedules',
    'Landmark Judgements of the Supreme Court',
    "Maharashtra's Political System"
  ],
  history: [
    'Ancient India',
    'Medieval India',
    'Maratha Empire',
    'Arrival of Europeans',
    'British Rule in India',
    'Socio-Cultural Changes',
    'Revolt of 1857',
    'Indian National Congress',
    'National Movement (1905-1919)',
    'Gandhian Era (1919-1947)',
    'Revolutionary Nationalism',
    'Muslim Politics',
    'Dalit Movement',
    'Peasant and Tribal Movements',
    'Integration of Princely States',
    'Post-Independence India',
    'History of Maharashtra',
    'Samyukta Maharashtra Movement',
    'Important Personalities',
    'Cultural Heritage of India',
  ],
  geography: [
    'Physical Geography of India',
    'River Systems of India',
    'Soils in India',
    'Natural Vegetation and Wildlife',
    'Agriculture in India',
    'Mineral and Energy Resources',
    'Industries in India',
    'Transport and Communication',
    'Population and Demographics',
    'Physical Geography of Maharashtra',
    'Economic Geography of Maharashtra',
    'Geomorphology',
    'Climatology',
    'Oceanography',
    'Biogeography',
    'Environmental Geography',
    'World Geography',
    'Map Reading and Interpretation',
    'Remote Sensing and GIS',
    'Disaster Management',
  ],
  economy: [
    'Indian Economy on the Eve of Independence',
    'Five-Year Plans',
    'Economic Reforms since 1991',
    'Poverty, Inequality, and Unemployment',
    'Inflation',
    'Money and Banking',
    'Public Finance',
    'National Income',
    'Agriculture',
    'Industrial Policy and Performance',
    'Foreign Trade and Balance of Payments',
    'Infrastructure',
    'Human Development',
    'Economy of Maharashtra',
    'International Economic Institutions',
    'Sustainable Development and Climate Change',
    'Rural Development',
    'Government Schemes',
    'Stock Market and Financial Instruments',
    'Demographics and Economic Impact',
  ],
  english: [
    'Grammar',
    'Tenses',
    'Voice',
    'Narration',
    'Articles',
    'Subject-Verb Agreement',
    'Sentence Structure',
    'Vocabulary',
    'Idioms and Phrases',
    'One-Word Substitution',
    'Fill in the Blanks',
    'Error Spotting and Correction',
    'Sentence Rearrangement',
    'Comprehension',
    'Precis Writing',
    'Letter/Essay Writing',
    'Transformation of Sentences',
    'Question Tags',
    'Spelling Correction',
    'Punctuation',
  ],
  marathi: [
    'वर्णमाला',
    'संधी',
    'शब्दांच्या जाती',
    'नाम',
    'सर्वनाम',
    'विशेषण',
    'क्रियापद',
    'लिंग आणि वचन',
    'विभक्ती',
    'प्रयोग',
    'काळ',
    'समास',
    'अलंकार',
    'वाक्यप्रचार आणि म्हणी',
    'समानार्थी/विरुद्धार्थी शब्द',
    'शब्दसमूहाबद्दल एक शब्द',
    'विरामचिन्हे',
    'वाक्याचे प्रकार',
    'शुद्धलेखन',
    'उतारा आकलन',
  ],
  gk: [
    'Current Affairs',
    'Important Days and Dates',
    'Books and Authors',
    'Awards and Honours',
    'Sports',
    'Science and Technology',
    'Environment and Ecology',
    'Indian Culture and Heritage',
    'World Organizations',
    'Indian Economy Basics',
    'Indian Polity Basics',
    'Indian History Basics',
    'Geography Basics',
    'First in India and World',
    'Government Schemes and Policies',
    'Summits and Conferences',
    'Abbreviations and Full Forms',
    'Static GK about Maharashtra',
    'Countries, Capitals, and Currencies',
    'Major Inventions and Discoveries',
  ],
  aptitude: [
    'Number System',
    'HCF and LCM',
    'Simplification and Approximation',
    'Percentage',
    'Ratio and Proportion',
    'Average',
    'Profit and Loss',
    'Simple and Compound Interest',
    'Time and Work',
    'Time, Speed, and Distance',
    'Partnership',
    'Mixtures and Alligations',
    'Algebra',
    'Geometry',
    'Mensuration',
    'Trigonometry',
    'Data Interpretation',
    'Probability',
    'Permutation and Combination',
    'Series and Progressions',
  ],
  agriculture: [
    'Farming',
    'Soil',
    'Irrigation',
    'Agri-Tech',
    'Policy',
    'Horticulture',
    'Seeds and Varieties',
    'Fertilizers and Manures',
    'Plant Protection',
    'Farm Machinery',
    'Post-Harvest Management',
    'Storage and Marketing',
    'Dairy',
    'Fisheries',
    'Organic Farming',
    'Weather and Climate',
    'Credit and Insurance',
    'Extension Services',
    'Sustainability',
    'Allied Sectors',
  ],
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function seedTopics() {
  const connectionString = process.env.DATABASE_URL!;
  const sql = postgres(connectionString, { max: 1 });

  // Load categories
  const categories = await sql/*sql*/`select category_id, slug from practice_categories`;
  const slugToCategoryId = new Map<string, string>(categories.map((c: any) => [c.slug, c.category_id]));

  let totalInserted = 0;

  for (const [slug, topics] of Object.entries(topicsByCategory)) {
    const categoryId = slugToCategoryId.get(slug);
    if (!categoryId) {
      console.log(`Skipping '${slug}' — category not found`);
      continue;
    }

    // Clear existing topics for idempotency
    await sql/*sql*/`delete from practice_topics where category_id = ${categoryId}`;

    const rows = topics.map((name, idx) => ({
      categoryId,
      name,
      description: null,
      slug: toSlug(name),
      sortOrder: idx + 1,
      isActive: true,
    }));

    if (rows.length > 0) {
      let insertedCount = 0;
      for (const r of rows) {
        const res = await sql/*sql*/`
          insert into practice_topics (category_id, name, description, slug, sort_order, is_active)
          values (${r.categoryId}, ${r.name}, ${r.description}, ${r.slug}, ${r.sortOrder}, ${r.isActive})
          returning topic_id
        `;
        insertedCount += res.length;
      }
      totalInserted += insertedCount;
      console.log(`Upserted ${insertedCount} topics for '${slug}'`);
    } else {
      console.log(`No topics to insert for '${slug}'`);
    }
  }

  console.log(`Done. Inserted ${totalInserted} topics across categories.`);
  await sql.end({ timeout: 1 });
}

seedTopics()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

