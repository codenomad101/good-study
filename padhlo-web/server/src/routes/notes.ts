import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteById
} from '../controllers/notes';

const router = Router();

// All routes require authentication
router.get('/', authenticateToken, getNotes);
router.get('/:noteId', authenticateToken, getNoteById);
router.post('/', authenticateToken, createNote);
router.put('/:noteId', authenticateToken, updateNote);
router.delete('/:noteId', authenticateToken, deleteNote);

export default router;

