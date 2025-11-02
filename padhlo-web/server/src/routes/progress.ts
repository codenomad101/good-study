import { Router } from 'express';
import { ProgressService } from '../services/progress';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const progressService = new ProgressService();

// Validation schemas
const UpdateProgressSchema = z.object({
  topicId: z.string().uuid('Invalid topic ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  totalQuestionsAttempted: z.number().min(0).optional(),
  correctAnswers: z.number().min(0).optional(),
  totalTimeSpentSeconds: z.number().min(0).optional(),
  masteryLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  masteryPercentage: z.number().min(0).max(100).optional(),
  averageAccuracy: z.number().min(0).max(100).optional(),
  averageTimePerQuestionSeconds: z.number().min(0).optional(),
  needsRevision: z.boolean().optional(),
});

const CreatePracticeSessionSchema = z.object({
  topicId: z.string().uuid('Invalid topic ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  sessionDate: z.string(),
  sessionType: z.enum(['daily', 'custom', 'revision']).optional(),
  totalQuestions: z.number().min(0).optional(),
  questionsAttempted: z.number().min(0).optional(),
  correctAnswers: z.number().min(0).optional(),
  timeSpentSeconds: z.number().min(0).optional(),
  accuracyPercentage: z.number().min(0).max(100).optional(),
  pointsEarned: z.number().min(0).optional(),
  isCompleted: z.boolean().optional(),
});

const UpdatePracticeSessionSchema = z.object({
  totalQuestions: z.number().min(0).optional(),
  questionsAttempted: z.number().min(0).optional(),
  correctAnswers: z.number().min(0).optional(),
  timeSpentSeconds: z.number().min(0).optional(),
  accuracyPercentage: z.number().min(0).max(100).optional(),
  pointsEarned: z.number().min(0).optional(),
  isCompleted: z.boolean().optional(),
});

const AddQuestionHistorySchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  userAnswer: z.string().optional(),
  isCorrect: z.boolean().optional(),
  timeTakenSeconds: z.number().min(0).optional(),
  attemptNumber: z.number().min(1).optional(),
  sourceType: z.enum(['daily_practice', 'test', 'revision', 'custom_practice']).optional(),
  sourceId: z.string().uuid().optional(),
});

// User Progress routes
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { subjectId } = req.query;
    
    const progress = await progressService.getUserProgress(userId, subjectId as string);
    
    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user progress',
    });
  }
});

router.get('/progress/topic/:topicId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { topicId } = req.params;
    
    const progress = await progressService.getUserProgressByTopic(userId, topicId);
    
    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch topic progress',
    });
  }
});

router.put('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = UpdateProgressSchema.parse(req.body);
    
    const progress = await progressService.updateUserProgress(
      userId,
      validatedData.topicId,
      validatedData.subjectId,
      validatedData
    );
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: progress,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update progress',
    });
  }
});

// Daily Practice Sessions routes
router.post('/practice-sessions', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = CreatePracticeSessionSchema.parse(req.body);
    
    const session = await progressService.createDailyPracticeSession({
      userId,
      ...validatedData,
    });
    
    res.status(201).json({
      success: true,
      message: 'Practice session created successfully',
      data: session,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create practice session',
    });
  }
});

router.get('/practice-sessions', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { startDate, endDate } = req.query;
    
    const sessions = await progressService.getUserDailyPracticeSessions(
      userId,
      startDate as string,
      endDate as string
    );
    
    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch practice sessions',
    });
  }
});

router.put('/practice-sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const validatedData = UpdatePracticeSessionSchema.parse(req.body);
    
    const session = await progressService.updateDailyPracticeSession(sessionId, validatedData);
    
    res.json({
      success: true,
      message: 'Practice session updated successfully',
      data: session,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update practice session',
    });
  }
});

// Question History routes
router.post('/question-history', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = AddQuestionHistorySchema.parse(req.body);
    
    const history = await progressService.addQuestionHistory({
      userId,
      ...validatedData,
    });
    
    res.status(201).json({
      success: true,
      message: 'Question history added successfully',
      data: history,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add question history',
    });
  }
});

router.get('/question-history', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { questionId, limit = '50' } = req.query;
    
    const history = await progressService.getUserQuestionHistory(
      userId,
      questionId as string,
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch question history',
    });
  }
});

// Analytics and Statistics routes
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { days = '30' } = req.query;
    
    const stats = await progressService.getUserStats(userId, parseInt(days as string));
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user statistics',
    });
  }
});

router.get('/stats/subject-wise', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    const subjectProgress = await progressService.getSubjectWiseProgress(userId);
    
    res.json({
      success: true,
      data: subjectProgress,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subject-wise progress',
    });
  }
});

router.get('/stats/weak-topics', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { limit = '10' } = req.query;
    
    const weakTopics = await progressService.getWeakTopics(userId, parseInt(limit as string));
    
    res.json({
      success: true,
      data: weakTopics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weak topics',
    });
  }
});

export default router;

