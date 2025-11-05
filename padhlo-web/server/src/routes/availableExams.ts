import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getAvailableExams,
  getAvailableExam,
  createAvailableExam,
  updateAvailableExam,
  deleteAvailableExam,
} from '../controllers/availableExams';

const router = Router();

// Public routes - anyone can view available exams
router.get('/', getAvailableExams);
router.get('/:examId', getAvailableExam);

// Admin-only routes
router.post('/', authenticateToken, requireAdmin, createAvailableExam);
router.put('/:examId', authenticateToken, requireAdmin, updateAvailableExam);
router.delete('/:examId', authenticateToken, requireAdmin, deleteAvailableExam);

export default router;

