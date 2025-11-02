import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPracticeCategories,
  getPracticeTopics,
  createPracticeSession,
  getPracticeSession,
  updatePracticeSessionAnswer,
  completePracticeSession,
  getUserPracticeHistory,
  getUserPracticeStats
} from '../controllers/practice';

const router = Router();

// Public routes
router.get('/categories', getPracticeCategories);
router.get('/topics', getPracticeTopics);

// Protected routes - specific routes first
router.get('/history', authenticateToken, getUserPracticeHistory);
router.get('/stats', authenticateToken, getUserPracticeStats);

// Parameterized routes after specific routes
router.post('/sessions', authenticateToken, createPracticeSession);
router.get('/sessions/:sessionId', authenticateToken, getPracticeSession);
router.patch('/sessions/:sessionId/answer', authenticateToken, updatePracticeSessionAnswer);
router.patch('/sessions/:sessionId/complete', authenticateToken, completePracticeSession);

export default router;
