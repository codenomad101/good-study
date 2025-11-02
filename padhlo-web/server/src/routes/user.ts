import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { AuthService } from '../services/auth';

const router = Router();
const authService = new AuthService();

// Validation schemas
const UpdateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  phone: z.string().optional(),
  profilePictureUrl: z.string().url('Invalid profile picture URL').optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  preferredLanguage: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Profile data retrieved successfully',
      data: {
        user: {
          userId: user.userId,
          username: user.username,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
          profilePictureUrl: user.profilePictureUrl,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          preferredLanguage: user.preferredLanguage,
          subscriptionType: user.subscriptionType,
          totalPoints: user.totalPoints,
          level: user.level,
          coins: user.coins,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          totalStudyTimeMinutes: user.totalStudyTimeMinutes,
          totalPracticeSessions: user.totalPracticeSessions,
          totalPracticeScore: user.totalPracticeScore,
          weeklyPracticeScore: user.weeklyPracticeScore,
          monthlyPracticeScore: user.monthlyPracticeScore,
          weeklyPracticeCount: user.weeklyPracticeCount,
          monthlyPracticeCount: user.monthlyPracticeCount,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = UpdateProfileSchema.parse(req.body);
    
    const updatedUser = await authService.updateProfile(req.user.userId, validatedData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = ChangePasswordSchema.parse(req.body);
    
    await authService.changePassword(req.user.userId, validatedData.currentPassword, validatedData.newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }
    
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;

