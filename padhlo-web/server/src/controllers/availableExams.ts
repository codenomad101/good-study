import { Request, Response } from 'express';
import { db } from '../db/index';
import { availableExams } from '../db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { z } from 'zod';

const CreateAvailableExamSchema = z.object({
  examName: z.string().min(1, 'Exam name is required'),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  examTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});

const UpdateAvailableExamSchema = z.object({
  examName: z.string().min(1).optional(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  examTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

// Get all available exams (public)
export const getAvailableExams = async (req: Request, res: Response) => {
  try {
    const { upcoming } = req.query;
    
    console.log('[AvailableExams] Fetching exams, upcoming:', upcoming);
    
    let exams;
    
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      console.log('[AvailableExams] Filtering for upcoming exams after:', today);
      exams = await db
        .select()
        .from(availableExams)
        .where(
          and(
            eq(availableExams.isActive, true),
            gte(availableExams.examDate, today)
          )
        )
        .orderBy(availableExams.examDate);
    } else {
      exams = await db
        .select()
        .from(availableExams)
        .where(eq(availableExams.isActive, true))
        .orderBy(availableExams.examDate);
    }
    
    console.log('[AvailableExams] Found exams:', exams.length);
    console.log('[AvailableExams] Exams data:', exams);
    
    res.json({
      success: true,
      data: exams,
    });
  } catch (error: any) {
    console.error('[AvailableExams] Error fetching exams:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch available exams',
    });
  }
};

// Get single available exam (public)
export const getAvailableExam = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    
    const [exam] = await db
      .select()
      .from(availableExams)
      .where(eq(availableExams.examId, examId));
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }
    
    res.json({
      success: true,
      data: exam,
    });
  } catch (error: any) {
    console.error('[AvailableExams] Error fetching exam:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch exam',
    });
  }
};

// Create available exam (admin only)
export const createAvailableExam = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateAvailableExamSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    
    const [exam] = await db
      .insert(availableExams)
      .values({
        examName: validatedData.examName,
        examDate: validatedData.examDate,
        examTime: validatedData.examTime || null,
        description: validatedData.description || null,
        sortOrder: validatedData.sortOrder || 0,
        isActive: true,
        createdBy: userId || null,
      })
      .returning();
    
    res.status(201).json({
      success: true,
      message: 'Available exam created successfully',
      data: exam,
    });
  } catch (error: any) {
    console.error('[AvailableExams] Error creating exam:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create available exam',
    });
  }
};

// Update available exam (admin only)
export const updateAvailableExam = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const validatedData = UpdateAvailableExamSchema.parse(req.body);
    
    const [exam] = await db
      .select()
      .from(availableExams)
      .where(eq(availableExams.examId, examId));
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }
    
    const [updatedExam] = await db
      .update(availableExams)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(availableExams.examId, examId))
      .returning();
    
    res.json({
      success: true,
      message: 'Available exam updated successfully',
      data: updatedExam,
    });
  } catch (error: any) {
    console.error('[AvailableExams] Error updating exam:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update available exam',
    });
  }
};

// Delete available exam (admin only)
export const deleteAvailableExam = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    
    const [exam] = await db
      .select()
      .from(availableExams)
      .where(eq(availableExams.examId, examId));
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }
    
    await db
      .delete(availableExams)
      .where(eq(availableExams.examId, examId));
    
    res.json({
      success: true,
      message: 'Available exam deleted successfully',
    });
  } catch (error: any) {
    console.error('[AvailableExams] Error deleting exam:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete available exam',
    });
  }
};

