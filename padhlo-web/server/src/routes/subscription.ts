import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCurrentSubscription,
  startTrial,
  subscribeToPro,
  subscribeToLite,
  renewSubscription,
  cancelSubscription,
  getRemainingSessions,
  handleTrialExpiry
} from '../controllers/subscription';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get current subscription status
router.get('/status', getCurrentSubscription);

// Get remaining sessions for today
router.get('/remaining-sessions', getRemainingSessions);

// Start trial (3 days)
router.post('/trial', startTrial);

// Subscribe to Pro plan (₹59/month, 30 days)
router.post('/pro', subscribeToPro);

// Subscribe to Lite plan (30 days)
router.post('/lite', subscribeToLite);

// Renew subscription (extend by 30 days)
router.post('/renew', renewSubscription);

// Cancel subscription
router.post('/cancel', cancelSubscription);

// Handle trial expiry (user chooses to auto-pay to pro or switch to free)
const HandleTrialExpirySchema = z.object({
  autoPayToPro: z.boolean()
});

router.post('/handle-trial-expiry', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { autoPayToPro } = HandleTrialExpirySchema.parse(req.body);
    const result = await handleTrialExpiry(userId, autoPayToPro);
    
    res.json({
      success: result.success,
      message: result.message,
      data: {
        newPlan: result.newPlan
      }
    });
  } catch (error: any) {
    console.error('Error handling trial expiry:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error handling trial expiry'
    });
  }
});

export default router;

