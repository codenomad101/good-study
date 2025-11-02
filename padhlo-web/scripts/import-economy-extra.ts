import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

function toSlug(name: string): string {
	return name.toLowerCase().replace(/[()]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

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
		const idx = options.find((o) => o.text.trim().toLowerCase() === q.CorrectAnswer.trim().toLowerCase());
		if (idx) correctOption = idx.id;
	}
	if (correctOption && options.length) {
		const opt = options.find((o) => o.id === correctOption);
		if (opt) correctAnswerText = opt.text;
	}
	if (!correctAnswerText && typeof q.CorrectAnswer === 'string') correctAnswerText = q.CorrectAnswer;
	return { correctOption, correctAnswerText };
}

function inferTopicSlug(question: string, explanation: string): string | undefined {
	const text = `${question} ${explanation}`.toLowerCase();
	if (/(rbi|bank|branch|npa|repo|slr|crr)/.test(text)) return 'banking';
	if (/(microfinance|nbfc|shg|jlg)/.test(text)) return 'microfinance';
	if (/(inflation|cpi|wpi)/.test(text)) return 'inflation';
	if (/(budget|fiscal|gst|tax)/.test(text)) return 'public-finance';
	if (/(gnp|gdp|national income)/.test(text)) return 'national-income';
	if (/(export|import|trade|balance of payments|bop|current account|capital account)/.test(text)) return 'foreign-trade-and-balance-of-payments';
	if (/(infrastructure|energy|transport|communication)/.test(text)) return 'infrastructure';
	if (/(human development|education|health)/.test(text)) return 'human-development';
	if (/(scheme|yojana|pm-)/.test(text)) return 'government-schemes';
	return undefined;
}

async function main() {
	const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

	// Resolve category id for economy
	const cats = await sql/*sql*/`select category_id from practice_categories where slug = 'economy' limit 1`;
	if (!cats || (cats as any[]).length === 0) {
		throw new Error('Economy category not found. Seed categories first.');
	}
	const categoryId = (cats as any[])[0].category_id as string;

	// Find file
	const candidates = [
		path.resolve(process.cwd(), 'data/English/economy/economyEnglish2.json'),
		path.resolve(process.cwd(), 'data/English/economy/economyEnglish1.json'),
		path.resolve(process.cwd(), 'data/English/economyExtra.json'),
		path.resolve(process.cwd(), 'data/economyExtra.json'),
	];
	const filePath = candidates.find((p) => fs.existsSync(p));
	if (!filePath) throw new Error('economyEnglish2.json or economyExtra.json not found.');

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
		const topicSlug = q.topic ? toSlug(q.topic) : inferTopicSlug(questionText, explanation);

		// Deduplicate by question text under same category
		const exists = await sql/*sql*/`select question_id from practice_questions where category_id = ${categoryId} and question_text = ${questionText} limit 1`;
		if ((exists as any[]).length > 0) { skipped++; continue; }

			await sql/*sql*/`
				insert into practice_questions (
					category_id, question_text, options, correct_answer, correct_option, explanation,
					difficulty, marks, question_type, job, original_category, source, status, topic
				) values (
					${categoryId}, ${questionText}, ${JSON.stringify(options)}, ${correctAnswerText}, ${correctOption}, ${explanation},
					${(q.Difficulty || 'medium').toString().toLowerCase()}, ${q.marks || 1}, 'mcq', ${JSON.stringify(q.Job ? (Array.isArray(q.Job) ? q.Job : String(q.Job).split(',').map((s: string) => s.trim())) : [])},
					${q.category || 'Economy'}, ${path.basename(filePath)}, 'active', ${topicSlug || null}
				)
			`;
		inserted++;
	}

	await sql.end({ timeout: 1 });
	console.log(`Imported economy questions. inserted=${inserted}, skipped=${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

