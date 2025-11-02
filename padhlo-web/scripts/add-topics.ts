import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Basic keyword maps per category to infer topic
const topicMaps: Record<string, Array<{ topic: string; keywords: string[] }>> = {
  agriculture: [
    { topic: 'farming', keywords: ['farm', 'farmer', 'crop', 'cultivation', 'paddy', 'wheat', 'rice'] },
    { topic: 'soil', keywords: ['soil', 'fertility', 'manure', 'fertilizer', 'mulch', 'organic'] },
    { topic: 'irrigation', keywords: ['irrigation', 'water', 'drip', 'sprinkler', 'canal'] },
    { topic: 'agri-tech', keywords: ['agritech', 'sensor', 'IoT', 'drone', 'precision', 'AI'] },
    { topic: 'policy', keywords: ['scheme', 'subsidy', 'MSP', 'mandi', 'procurement', 'PM-KISAN'] },
    { topic: 'horticulture', keywords: ['fruit', 'vegetable', 'horticulture', 'orchard', 'post-harvest'] },
  ],
  economy: [
    { topic: 'banking', keywords: ['bank', 'RBI', 'loan', 'credit', 'NPA', 'deposit', 'branch'] },
    { topic: 'microfinance', keywords: ['microfinance', 'SHG', 'NBFC-MFI', 'JLG'] },
    { topic: 'inflation', keywords: ['inflation', 'CPI', 'WPI', 'price index'] },
    { topic: 'fiscal', keywords: ['budget', 'fiscal', 'deficit', 'tax', 'gst', 'excise'] },
    { topic: 'trade', keywords: ['export', 'import', 'FTA', 'WTO', 'trade'] },
    { topic: 'markets', keywords: ['stock', 'SEBI', 'market', 'IPO', 'Sensex', 'Nifty'] },
  ],
  gk: [
    { topic: 'current-affairs', keywords: ['launched', 'initiative', 'scheme', 'appointed', 'awarded'] },
    { topic: 'india', keywords: ['india', 'state', 'ministry', 'government'] },
  ],
  history: [
    { topic: 'medieval', keywords: ['mughal', 'maratha', 'sultanate', 'shivaji', 'aurangzeb'] },
    { topic: 'modern', keywords: ['british', 'congress', 'gandhi', 'nehru', 'company', 'revolt'] },
    { topic: 'ancient', keywords: ['maurya', 'gupta', 'vedic', 'harappa', 'buddhism'] },
  ],
  geography: [
    { topic: 'physical', keywords: ['river', 'mountain', 'plateau', 'delta', 'monsoon'] },
    { topic: 'human', keywords: ['population', 'urban', 'rural', 'migration', 'industry'] },
  ],
  english: [
    { topic: 'grammar', keywords: ['grammar', 'tense', 'preposition', 'conjunction', 'voice', 'narration'] },
    { topic: 'vocabulary', keywords: ['synonym', 'antonym', 'idiom', 'phrase', 'one-word'] },
  ],
  aptitude: [
    { topic: 'quantitative', keywords: ['ratio', 'percentage', 'profit', 'loss', 'interest', 'algebra'] },
    { topic: 'logical', keywords: ['reasoning', 'arrangement', 'coding', 'decoding', 'series'] },
  ],
};

const englishDir = path.resolve(process.cwd(), 'data/English');

function detectCategoryFromFilename(filename: string): keyof typeof topicMaps | undefined {
  const lower = filename.toLowerCase();
  if (lower.includes('agriculture')) return 'agriculture';
  if (lower.includes('economy')) return 'economy';
  if (lower.includes('gk')) return 'gk';
  if (lower.includes('history')) return 'history';
  if (lower.includes('geography')) return 'geography';
  if (lower.includes('english')) return 'english';
  if (lower.includes('aptitude')) return 'aptitude';
  return undefined;
}

function inferTopic(category: keyof typeof topicMaps | undefined, questionObj: any): string {
  if (!category) return 'general';
  const textParts: string[] = [];
  const pushIfString = (v: any) => { if (typeof v === 'string') textParts.push(v.toLowerCase()); };

  pushIfString(questionObj.Question);
  pushIfString(questionObj.Explanation);
  pushIfString(questionObj.category);
  if (Array.isArray(questionObj.Options)) {
    for (const opt of questionObj.Options) {
      if (opt && typeof opt === 'object') pushIfString(opt.text);
      else if (typeof opt === 'string') textParts.push(opt.toLowerCase());
    }
  }

  const haystack = textParts.join(' ');
  const candidates = topicMaps[category] || [];
  for (const rule of candidates) {
    if (rule.keywords.some(k => haystack.includes(k.toLowerCase()))) {
      return rule.topic;
    }
  }
  return 'general';
}

async function processFile(filePath: string) {
  const fileName = path.basename(filePath);
  const category = detectCategoryFromFilename(fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  let arr: any[];
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON:', fileName);
    return;
  }
  if (!Array.isArray(arr)) {
    console.error('Not an array:', fileName);
    return;
  }

  let updated = 0;
  const out = arr.map(q => {
    if (!q.topic) {
      const topic = inferTopic(category, q);
      updated += 1;
      return { ...q, topic };
    }
    return q;
  });

  fs.writeFileSync(filePath, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`Updated ${updated} items in ${fileName}`);
}

async function main() {
  const files = fs.readdirSync(englishDir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    await processFile(path.join(englishDir, f));
  }
  console.log('Topic annotation complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
