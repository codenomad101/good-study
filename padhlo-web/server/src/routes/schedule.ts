import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleById,
  getStudyLogs,
  logStudySession
} from '../controllers/schedule';

const router = Router();

// All routes require authentication
router.get('/', authenticateToken, getSchedules);
router.get('/logs', authenticateToken, getStudyLogs);
router.get('/:scheduleId', authenticateToken, getScheduleById);
router.post('/', authenticateToken, createSchedule);
router.post('/logs', authenticateToken, logStudySession);
router.put('/:scheduleId', authenticateToken, updateSchedule);
router.delete('/:scheduleId', authenticateToken, deleteSchedule);

export default router;

