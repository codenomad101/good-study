import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getJobs,
  getJobById,
  getJobByShortCode,
  createJob,
  updateJob,
  deleteJob,
  getJobsWithStats
} from '../controllers/jobs';

const router = Router();

// Public routes
router.get('/', getJobs);
router.get('/stats', getJobsWithStats);
router.get('/short-code/:shortCode', getJobByShortCode);
router.get('/:jobId', getJobById);

// Protected routes (admin only)
router.post('/', authenticateToken, createJob);
router.put('/:jobId', authenticateToken, updateJob);
router.delete('/:jobId', authenticateToken, deleteJob);

export default router;
