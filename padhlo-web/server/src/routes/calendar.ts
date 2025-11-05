import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getReminderById
} from '../controllers/calendar';

const router = Router();

// All routes require authentication
router.get('/', authenticateToken, getReminders);
router.get('/:reminderId', authenticateToken, getReminderById);
router.post('/', authenticateToken, createReminder);
router.put('/:reminderId', authenticateToken, updateReminder);
router.delete('/:reminderId', authenticateToken, deleteReminder);

export default router;

