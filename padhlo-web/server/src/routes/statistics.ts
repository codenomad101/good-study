import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUserStatistics,
  updatePracticeStatistics,
  updateExamStatistics,
  getLeaderboard,
  getUserRank,
  updateAllRankings,
  getAvailableSubjects
} from '../controllers/statistics';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get user statistics
router.get('/user', getUserStatistics);

// Update practice statistics
router.post('/practice', updatePracticeStatistics);

// Update exam statistics
router.post('/exam', updateExamStatistics);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

// Get user rank
router.get('/rank', getUserRank);

// Update all rankings (admin only - you can add admin middleware here)
router.post('/update-rankings', updateAllRankings);

// Get available subjects for leaderboard
router.get('/subjects', getAvailableSubjects);

export default router;
