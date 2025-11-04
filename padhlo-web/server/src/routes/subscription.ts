import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCurrentSubscription,
  startTrial,
  subscribeToPro,
  subscribeToLite,
  renewSubscription,
  cancelSubscription
} from '../controllers/subscription';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get current subscription status
router.get('/status', getCurrentSubscription);

// Start trial (7 days)
router.post('/trial', startTrial);

// Subscribe to Pro plan (30 days)
router.post('/pro', subscribeToPro);

// Subscribe to Lite plan (30 days)
router.post('/lite', subscribeToLite);

// Renew subscription (extend by 30 days)
router.post('/renew', renewSubscription);

// Cancel subscription
router.post('/cancel', cancelSubscription);

export default router;

