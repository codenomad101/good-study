import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireNotesAccess } from '../middleware/subscription';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
  uploadNoteAttachment,
  uploadAttachment
} from '../controllers/notes';

const router = Router();

// All routes require authentication and notes access (not available in free plan)
router.get('/', authenticateToken, requireNotesAccess, getNotes);
router.get('/:noteId', authenticateToken, requireNotesAccess, getNoteById);
router.post('/', authenticateToken, requireNotesAccess, createNote);
router.put('/:noteId', authenticateToken, requireNotesAccess, updateNote);
router.delete('/:noteId', authenticateToken, requireNotesAccess, deleteNote);
router.post('/upload', authenticateToken, requireNotesAccess, uploadAttachment.single('file'), uploadNoteAttachment);

export default router;

