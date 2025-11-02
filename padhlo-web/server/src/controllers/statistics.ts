import { Request, Response } from 'express';
import { StatisticsService } from '../services/statistics';
import { z } from 'zod';

const statisticsService = new StatisticsService();

// Validation schemas
const UpdatePracticeStatsSchema = z.object({
  questionsAttempted: z.number().min(0),
  correctAnswers: z.number().min(0),
  incorrectAnswers: z.number().min(0),
  skippedQuestions: z.number().min(0),
  timeSpentMinutes: z.number().min(0),
});

const UpdateExamStatsSchema = z.object({
  questionsAttempted: z.number().min(0),
  correctAnswers: z.number().min(0),
  incorrectAnswers: z.number().min(0),
  timeSpentMinutes: z.number().min(0),
});

const GetLeaderboardSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'alltime']).optional(),
  category: z.enum(['overall', 'practice', 'exam', 'streak', 'accuracy']).optional(),
  subjectId: z.string().optional(),
  limit: z.string().optional(),
});

const GetSubjectLeaderboardSchema = z.object({
  categoryId: z.string().uuid(),
  period: z.enum(['daily', 'weekly', 'monthly', 'alltime']).optional(),
  category: z.enum(['overall', 'practice', 'exam', 'accuracy']).optional(),
  limit: z.string().optional(),
});

// Get user statistics
export const getUserStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const stats = await statisticsService.getUserStatistics(userId);
    
    res.json({
      success: true,
      data: stats,
      message: 'User statistics retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user statistics'
    });
  }
};

// Update practice statistics
export const updatePracticeStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = UpdatePracticeStatsSchema.parse(req.body);
    
    await statisticsService.updatePracticeStatistics(userId, validatedData);
    
    res.json({
      success: true,
      message: 'Practice statistics updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating practice statistics:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update practice statistics'
    });
  }
};

// Update exam statistics
export const updateExamStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = UpdateExamStatsSchema.parse(req.body);
    
    await statisticsService.updateExamStatistics(userId, validatedData);
    
    res.json({
      success: true,
      message: 'Exam statistics updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating exam statistics:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update exam statistics'
    });
  }
};

// Get leaderboard
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { period = 'alltime', category = 'overall', subjectId, limit = '50' } = req.query;
    const validatedQuery = GetLeaderboardSchema.parse({ period, category, subjectId, limit });
    
    let leaderboard;
    
    if (validatedQuery.subjectId) {
      // Subject-specific leaderboard
      leaderboard = await statisticsService.getSubjectLeaderboard(
        validatedQuery.subjectId,
        validatedQuery.category as 'overall' | 'practice' | 'exam' | 'accuracy',
        validatedQuery.period as 'daily' | 'weekly' | 'monthly' | 'alltime',
        parseInt(limit as string)
      );
    } else {
      // Overall leaderboard
      leaderboard = await statisticsService.getCategoryLeaderboard(
        validatedQuery.category as 'overall' | 'practice' | 'exam' | 'streak' | 'accuracy',
        validatedQuery.period as 'daily' | 'weekly' | 'monthly' | 'alltime',
        parseInt(limit as string)
      );
    }
    
    res.json({
      success: true,
      data: leaderboard,
      message: 'Leaderboard retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get leaderboard'
    });
  }
};

// Get user rank
export const getUserRank = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { period = 'alltime' } = req.query;
    
    const rank = await statisticsService.getUserRank(userId, period as 'daily' | 'weekly' | 'monthly' | 'alltime');
    
    res.json({
      success: true,
      data: { rank },
      message: 'User rank retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting user rank:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user rank'
    });
  }
};

// Update all rankings (admin only)
export const updateAllRankings = async (req: Request, res: Response) => {
  try {
    await statisticsService.updateAllRankings();
    
    res.json({
      success: true,
      message: 'All rankings updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating all rankings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update all rankings'
    });
  }
};

// Get available subjects for leaderboard
export const getAvailableSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await statisticsService.getAvailableSubjects();
    
    res.json({
      success: true,
      data: subjects,
      message: 'Available subjects retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error getting available subjects:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get available subjects'
    });
  }
};
