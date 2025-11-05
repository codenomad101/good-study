import { Request, Response } from 'express';
import { db } from '../db';
import { examReminders, type NewExamReminder } from '../db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const CreateReminderSchema = z.object({
  examName: z.string().min(1, 'Exam name is required').max(200),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  examTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional().nullable(),
  description: z.string().optional().nullable(),
  reminderBeforeDays: z.number().int().min(0).max(365).optional().default(7),
  reminderEnabled: z.boolean().optional().default(true),
});

const UpdateReminderSchema = CreateReminderSchema.partial();

// GET /api/calendar - Get all reminders for authenticated user
export const getReminders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { upcoming } = req.query as { upcoming?: string };

    let query = db
      .select()
      .from(examReminders)
      .where(eq(examReminders.userId, userId))
      .orderBy(desc(examReminders.examDate));

    // If upcoming=true, only return future dates
    if (upcoming === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query = query.where(
        and(
          eq(examReminders.userId, userId),
          gte(examReminders.examDate, today)
        )
      ) as any;
    }

    const reminders = await query;

    res.json({
      success: true,
      data: reminders,
    });
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch reminders',
    });
  }
};

// GET /api/calendar/:reminderId - Get a specific reminder
export const getReminderById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { reminderId } = req.params;

    const [reminder] = await db
      .select()
      .from(examReminders)
      .where(
        and(
          eq(examReminders.reminderId, reminderId),
          eq(examReminders.userId, userId)
        )
      )
      .limit(1);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    res.json({
      success: true,
      data: reminder,
    });
  } catch (error: any) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch reminder',
    });
  }
};

// POST /api/calendar - Create a new reminder
export const createReminder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = CreateReminderSchema.parse(req.body);

    const newReminder: NewExamReminder = {
      userId,
      examName: validatedData.examName,
      examDate: validatedData.examDate,
      examTime: validatedData.examTime || null,
      description: validatedData.description || null,
      reminderBeforeDays: validatedData.reminderBeforeDays || 7,
      reminderEnabled: validatedData.reminderEnabled !== false,
    };

    const [created] = await db.insert(examReminders).values(newReminder).returning();

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: created,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Error creating reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create reminder',
    });
  }
};

// PUT /api/calendar/:reminderId - Update a reminder
export const updateReminder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { reminderId } = req.params;
    const validatedData = UpdateReminderSchema.parse(req.body);

    // Check if reminder exists and belongs to user
    const [existing] = await db
      .select()
      .from(examReminders)
      .where(
        and(
          eq(examReminders.reminderId, reminderId),
          eq(examReminders.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    // Update reminder
    const [updated] = await db
      .update(examReminders)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(examReminders.reminderId, reminderId),
          eq(examReminders.userId, userId)
        )
      )
      .returning();

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update reminder',
    });
  }
};

// DELETE /api/calendar/:reminderId - Delete a reminder
export const deleteReminder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { reminderId } = req.params;

    // Check if reminder exists and belongs to user
    const [existing] = await db
      .select()
      .from(examReminders)
      .where(
        and(
          eq(examReminders.reminderId, reminderId),
          eq(examReminders.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    await db
      .delete(examReminders)
      .where(
        and(
          eq(examReminders.reminderId, reminderId),
          eq(examReminders.userId, userId)
        )
      );

    res.json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete reminder',
    });
  }
};

