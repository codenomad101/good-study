import { Router } from 'express';
import { EnhancedPracticeController } from '../controllers/enhancedPractice';

const router = Router();
const practiceController = new EnhancedPracticeController();

// Complete a practice session with detailed scoring
router.post('/complete/:userId', practiceController.completePracticeSession.bind(practiceController));

// Get user's practice history
router.get('/history/:userId', practiceController.getUserPracticeHistory.bind(practiceController));

// Get comprehensive practice statistics
router.get('/stats/:userId', practiceController.getUserPracticeStats.bind(practiceController));

// Get detailed session with explanations
router.get('/session/:sessionId/:userId', practiceController.getSessionDetails.bind(practiceController));

export default router;
