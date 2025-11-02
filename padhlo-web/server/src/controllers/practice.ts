import { Request, Response } from 'express';
import { PracticeService } from '../services/practice';
import { z } from 'zod';

const practiceService = new PracticeService();
// Get topics for a category (by slug or id)
export const getPracticeTopics = async (req: Request, res: Response) => {
  try {
    const { category } = req.query as { category?: string };
    if (!category) {
      return res.status(400).json({ success: false, message: 'category is required' });
    }

    const topics = await practiceService.getPracticeTopics(category);
    return res.json({ success: true, data: topics });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch topics' });
  }
};


// Validation schemas
const CreatePracticeSessionSchema = z.object({
  category: z.enum(['economy', 'gk', 'history', 'geography', 'english', 'aptitude', 'agriculture', 'marathi']),
  timeLimitMinutes: z.number().min(5).max(60).optional().default(15),
});

const UpdateAnswerSchema = z.object({
  questionId: z.string().min(1),
  userAnswer: z.string(),
  timeSpentSeconds: z.number().min(0),
});

// Get available practice categories
export const getPracticeCategories = async (req: Request, res: Response) => {
  try {
    const categories = await practiceService.getPracticeCategories();
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch practice categories',
    });
  }
};

// Create a new practice session
export const createPracticeSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = CreatePracticeSessionSchema.parse(req.body);
    
    const result = await practiceService.createPracticeSession(
      userId,
      validatedData.category,
      validatedData.timeLimitMinutes
    );
    
    res.status(201).json({
      success: true,
      message: 'Practice session created successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create practice session',
    });
  }
};

// Get practice session by ID
export const getPracticeSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { sessionId } = req.params;
    
    const session = await practiceService.getPracticeSession(sessionId, userId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Practice session not found',
      });
    }
    
    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch practice session',
    });
  }
};

// Update practice session with answer
export const updatePracticeSessionAnswer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { sessionId } = req.params;
    const validatedData = UpdateAnswerSchema.parse(req.body);
    
    const result = await practiceService.updatePracticeSessionAnswer(
      sessionId,
      userId,
      validatedData.questionId,
      validatedData.userAnswer,
      validatedData.timeSpentSeconds
    );
    
    res.json({
      success: true,
      message: 'Answer updated successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update answer',
    });
  }
};

// Complete practice session
export const completePracticeSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { sessionId } = req.params;
    
    const session = await practiceService.completePracticeSession(sessionId, userId);
    
    res.json({
      success: true,
      message: 'Practice session completed successfully',
      data: session,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete practice session',
    });
  }
};

// Get user's practice history
export const getUserPracticeHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { limit = '50', offset = '0' } = req.query;
    
    const sessions = await practiceService.getUserPracticeHistory(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch practice history',
    });
  }
};

// Get user's practice statistics
export const getUserPracticeStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const stats = await practiceService.getUserPracticeStats(userId);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch practice statistics',
    });
  }
};
