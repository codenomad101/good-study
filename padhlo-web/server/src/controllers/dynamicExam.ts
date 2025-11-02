import { Request, Response } from 'express';
import { DynamicExamService } from '../services/dynamicExam';
import { z } from 'zod';

const dynamicExamService = new DynamicExamService();

// Validation schemas
const CreateExamSessionSchema = z.object({
  examName: z.string().min(1, 'Exam name is required'),
  totalMarks: z.number().positive('Total marks must be positive'),
  durationMinutes: z.number().positive('Duration must be positive'),
  questionDistribution: z.array(z.object({
    category: z.string().min(1, 'Category is required'),
    count: z.number().positive('Count must be positive'),
    marksPerQuestion: z.number().positive('Marks per question must be positive'),
    topic: z.string().optional()
  })).min(1, 'At least one category is required'),
  negativeMarking: z.boolean().optional(),
  negativeMarksRatio: z.number().min(0).max(1).optional()
});

const CompleteExamSessionSchema = z.object({
  timeSpentSeconds: z.number().min(0),
  questionsAttempted: z.number().min(0),
  correctAnswers: z.number().min(0),
  incorrectAnswers: z.number().min(0),
  skippedQuestions: z.number().min(0),
  marksObtained: z.number(),
  percentage: z.number().min(0).max(100)
});

// Create a new dynamic exam session
export const createExamSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = CreateExamSessionSchema.parse(req.body);

    const session = await dynamicExamService.createExamSession(userId, validatedData);

    res.status(201).json({
      success: true,
      message: 'Exam session created successfully',
      data: session
    });
  } catch (error: any) {
    console.error('Error creating exam session:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create exam session'
    });
  }
};

// Start an exam session
export const startExamSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { sessionId } = req.params;

    const session = await dynamicExamService.startExamSession(sessionId, userId);

    res.json({
      success: true,
      message: 'Exam session started successfully',
      data: session
    });
  } catch (error: any) {
    console.error('Error starting exam session:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start exam session'
    });
  }
};

// Generate questions for exam session
export const generateExamQuestions = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.userId;

    // Get the exam session
    const session = await dynamicExamService.getExamSession(sessionId, userId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found'
      });
    }

    // Generate questions based on distribution
    const questions = await dynamicExamService.generateQuestionsFromCategories(
      session.questionDistribution as any[]
    );

    res.json({
      success: true,
      message: 'Questions generated successfully',
      data: {
        sessionId: session.sessionId,
        examName: session.examName,
        totalMarks: session.totalMarks,
        durationMinutes: session.durationMinutes,
        totalQuestions: session.totalQuestions,
        negativeMarking: session.negativeMarking,
        negativeMarksRatio: session.negativeMarksRatio,
        questions
      }
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate questions'
    });
  }
};

// Submit exam answers
export const submitExamAnswers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { sessionId } = req.params;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be an array'
      });
    }

    // Get the exam session
    const session = await dynamicExamService.getExamSession(sessionId, userId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found'
      });
    }

    // Update session with answers
    await dynamicExamService.updateExamSessionQuestions(sessionId, userId, answers);

    res.json({
      success: true,
      message: 'Answers submitted successfully'
    });
  } catch (error: any) {
    console.error('Error submitting answers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit answers'
    });
  }
};

// Complete exam session
export const completeExamSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { sessionId } = req.params;
    
    console.log('Received exam completion data:', req.body);
    const validatedData = CompleteExamSessionSchema.parse(req.body);

    const session = await dynamicExamService.completeExamSession(sessionId, userId, validatedData);

    res.json({
      success: true,
      message: 'Exam completed successfully',
      data: session
    });
  } catch (error: any) {
    console.error('Error completing exam session:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete exam session'
    });
  }
};

// Get exam session details
export const getExamSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { sessionId } = req.params;

    const session = await dynamicExamService.getExamSession(sessionId, userId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error fetching exam session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch exam session'
    });
  }
};

// Resume an incomplete exam session
export const resumeExamSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.userId;

    const session = await dynamicExamService.resumeExamSession(sessionId, userId);

    res.json({
      success: true,
      data: session,
      message: 'Exam session resumed successfully'
    });
  } catch (error: any) {
    console.error('Error resuming exam session:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to resume exam session'
    });
  }
};

// Get user's exam history
export const getUserExamHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { limit = '50', offset = '0' } = req.query;

    const history = await dynamicExamService.getUserExamHistory(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    console.error('Error fetching exam history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch exam history'
    });
  }
};

// Get user's exam statistics
export const getUserExamStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const stats = await dynamicExamService.getUserExamStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching exam stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch exam statistics'
    });
  }
};
