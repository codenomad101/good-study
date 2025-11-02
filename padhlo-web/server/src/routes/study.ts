import { Router } from 'express';
import { db } from '../db';
import { practiceCategories, practiceTopics, practiceStudyMaterials } from '../db/schema';
import { eq, and, count } from 'drizzle-orm';

const router = Router();

// GET study materials by category (slug or id), optional topicSlug, and optional language
router.get('/materials', async (req, res) => {
  try {
    const { category, topic, language, page = '1', pageSize = '10' } = req.query as { category?: string; topic?: string; language?: string; page?: string; pageSize?: string };
    if (!category) {
      return res.status(400).json({ success: false, message: 'category (slug or id) is required' });
    }

    // Resolve categoryId by slug if needed
    let categoryId = category;
    if (category.length !== 36) {
      const [cat] = await db.select().from(practiceCategories).where(eq(practiceCategories.slug, category));
      if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
      categoryId = cat.categoryId;
    }

    // Build where clause with language support
    const langCode = (language || 'en').toLowerCase();
    const where = topic
      ? and(eq(practiceStudyMaterials.categoryId, categoryId), eq(practiceStudyMaterials.topicSlug, topic), eq(practiceStudyMaterials.language, langCode))
      : and(eq(practiceStudyMaterials.categoryId, categoryId), eq(practiceStudyMaterials.language, langCode));

    const limit = Math.max(1, Math.min(50, parseInt(pageSize as string, 10) || 10));
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const offset = (pageNum - 1) * limit;

    try {
      const items = await db
        .select()
        .from(practiceStudyMaterials)
        .where(where)
        .limit(limit)
        .offset(offset);

      const totalRows = await db
        .select({ total: count() })
        .from(practiceStudyMaterials)
        .where(where);
      const total = totalRows?.[0]?.total || 0;

      if ((items?.length || 0) > 0) {
        return res.json({ success: true, data: { items, total } });
      }
    } catch (e) {
      // Table may not exist yet; fallback to topics-based materials below
    }

    // Fallback: derive concise notes from topics list
    const topicsQuery = await db
      .select()
      .from(practiceTopics)
      .where(eq(practiceTopics.categoryId, categoryId))
      .limit(limit)
      .offset(offset);

    const allTopicsForCount = await db
      .select({ total: count() })
      .from(practiceTopics)
      .where(eq(practiceTopics.categoryId, categoryId));
    const total = allTopicsForCount?.[0]?.total || 0;

    const items = topicsQuery
      .filter((t) => (topic ? t.slug === topic : true))
      .map((t) => ({
        materialId: `${t.topicId}`,
        categoryId,
        topicSlug: t.slug,
        title: `${t.name} – Key Points`,
        content: `Overview of ${t.name}. Definitions, core concepts, and frequently asked points for quick revision.`,
        tags: [t.slug],
      }));

    return res.json({ success: true, data: { items, total } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch study materials' });
  }
});

export default router;

