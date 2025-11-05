import { Request, Response } from 'express';
import { db } from '../db';
import { studySchedules, studySessionLogs, type NewStudySchedule, type NewStudySessionLog } from '../db/schema';
import { eq, and, desc, gte, sum, sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const CreateScheduleSchema = z.object({
  subjectName: z.string().min(1, 'Subject name is required').max(100),
  durationMinutes: z.number().int().min(1).max(1440), // Max 24 hours
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

const UpdateScheduleSchema = CreateScheduleSchema.partial();

const LogStudySessionSchema = z.object({
  scheduleId: z.string().uuid().optional().nullable(),
  subjectName: z.string().min(1, 'Subject name is required').max(100),
  durationMinutes: z.number().int().min(1).max(1440),
  completed: z.boolean().optional().default(true),
  notes: z.string().optional().nullable(),
});

// GET /api/schedule - Get all schedules for authenticated user
export const getSchedules = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { active } = req.query as { active?: string };

    let whereClause = eq(studySchedules.userId, userId);
    
    if (active === 'true') {
      whereClause = and(whereClause, eq(studySchedules.isActive, true)) as any;
    }

    const schedules = await db
      .select()
      .from(studySchedules)
      .where(whereClause)
      .orderBy(desc(studySchedules.createdAt));

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch schedules',
    });
  }
};

// GET /api/schedule/:scheduleId - Get a specific schedule
export const getScheduleById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { scheduleId } = req.params;

    const [schedule] = await db
      .select()
      .from(studySchedules)
      .where(
        and(
          eq(studySchedules.scheduleId, scheduleId),
          eq(studySchedules.userId, userId)
        )
      )
      .limit(1);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch schedule',
    });
  }
};

// POST /api/schedule - Create a new schedule
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = CreateScheduleSchema.parse(req.body);

    // Check if schedule already exists for this subject
    const [existing] = await db
      .select()
      .from(studySchedules)
      .where(
        and(
          eq(studySchedules.userId, userId),
          eq(studySchedules.subjectName, validatedData.subjectName),
          eq(studySchedules.isActive, true)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing schedule instead of creating duplicate
      const [updated] = await db
        .update(studySchedules)
        .set({
          durationMinutes: validatedData.durationMinutes,
          preferredTime: validatedData.preferredTime || null,
          isActive: validatedData.isActive !== false,
          updatedAt: new Date(),
        })
        .where(eq(studySchedules.scheduleId, existing.scheduleId))
        .returning();

      return res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: updated,
      });
    }

    const newSchedule: NewStudySchedule = {
      userId,
      subjectName: validatedData.subjectName,
      durationMinutes: validatedData.durationMinutes,
      preferredTime: validatedData.preferredTime || null,
      isActive: validatedData.isActive !== false,
    };

    const [created] = await db.insert(studySchedules).values(newSchedule).returning();

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
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
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create schedule',
    });
  }
};

// PUT /api/schedule/:scheduleId - Update a schedule
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { scheduleId } = req.params;
    const validatedData = UpdateScheduleSchema.parse(req.body);

    // Check if schedule exists and belongs to user
    const [existing] = await db
      .select()
      .from(studySchedules)
      .where(
        and(
          eq(studySchedules.scheduleId, scheduleId),
          eq(studySchedules.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    // Update schedule
    const [updated] = await db
      .update(studySchedules)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(studySchedules.scheduleId, scheduleId),
          eq(studySchedules.userId, userId)
        )
      )
      .returning();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
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
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update schedule',
    });
  }
};

// DELETE /api/schedule/:scheduleId - Delete a schedule
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { scheduleId } = req.params;

    // Check if schedule exists and belongs to user
    const [existing] = await db
      .select()
      .from(studySchedules)
      .where(
        and(
          eq(studySchedules.scheduleId, scheduleId),
          eq(studySchedules.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    await db
      .delete(studySchedules)
      .where(
        and(
          eq(studySchedules.scheduleId, scheduleId),
          eq(studySchedules.userId, userId)
        )
      );

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete schedule',
    });
  }
};

// GET /api/schedule/logs - Get study session logs
export const getStudyLogs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { subject, startDate, endDate, limit } = req.query as {
      subject?: string;
      startDate?: string;
      endDate?: string;
      limit?: string;
    };

    let whereClause = eq(studySessionLogs.userId, userId);

    if (subject) {
      whereClause = and(whereClause, eq(studySessionLogs.subjectName, subject)) as any;
    }

    if (startDate) {
      whereClause = and(whereClause, gte(studySessionLogs.sessionDate, startDate)) as any;
    }

    const logs = await db
      .select()
      .from(studySessionLogs)
      .where(whereClause)
      .orderBy(desc(studySessionLogs.sessionTime))
      .limit(limit ? parseInt(limit) : 100);

    // Get summary statistics
    const summary = await db
      .select({
        subjectName: studySessionLogs.subjectName,
        totalMinutes: sum(studySessionLogs.durationMinutes).as('total_minutes'),
        totalSessions: sql<number>`count(*)`.as('total_sessions'),
      })
      .from(studySessionLogs)
      .where(eq(studySessionLogs.userId, userId))
      .groupBy(studySessionLogs.subjectName);

    res.json({
      success: true,
      data: logs,
      summary: summary,
    });
  } catch (error: any) {
    console.error('Error fetching study logs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch study logs',
    });
  }
};

// POST /api/schedule/logs - Log a study session
export const logStudySession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = LogStudySessionSchema.parse(req.body);

    const newLog: NewStudySessionLog = {
      userId,
      scheduleId: validatedData.scheduleId || null,
      subjectName: validatedData.subjectName,
      durationMinutes: validatedData.durationMinutes,
      completed: validatedData.completed !== false,
      notes: validatedData.notes || null,
      sessionDate: new Date().toISOString().split('T')[0],
    };

    const [created] = await db.insert(studySessionLogs).values(newLog).returning();

    res.status(201).json({
      success: true,
      message: 'Study session logged successfully',
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
    console.error('Error logging study session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to log study session',
    });
  }
};

