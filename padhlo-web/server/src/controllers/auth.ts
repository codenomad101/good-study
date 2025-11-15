import { Request, Response } from 'express';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '../schemas/auth';
import { AuthService } from '../services/auth';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const authService = new AuthService();

// Multer configuration for profile picture uploads
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId || 'anonymous';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

export const uploadProfilePicture = multer({ 
  storage: profilePictureStorage,
  fileFilter: (req, file, cb) => {
    // Allow only images
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Only images are allowed.`));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /api/auth/upload-profile-picture - Upload profile picture
export const uploadProfilePictureHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate URL to access the file
    const fileUrl = `/uploads/profile-pictures/${req.file.filename}`;
    
    // Get base URL from request or environment variable
    const protocol = req.protocol || 'http';
    const host = req.get('host') || process.env.BASE_URL?.replace(/^https?:\/\//, '') || 'localhost:3000';
    const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
    const fullUrl = `${baseUrl}${fileUrl}`;

    // Update user profile with the new picture URL
    const updatedUser = await authService.updateProfile(userId, {
      profilePictureUrl: fullUrl
    });

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        url: fullUrl,
        user: updatedUser
      }
    });
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile picture'
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = RegisterInput.parse(req.body);
    const result = await authService.register(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific error cases
    if (error.message === 'User with this email already exists' || 
        error.message === 'User with this email or username already exists') {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }
    
    // Handle duplicate phone number error
    if (error.message && error.message.includes('phone number is already registered')) {
      return res.status(409).json({
        success: false,
        message: 'This phone number is already registered. You cannot use the same phone number for two accounts.',
      });
    }
    
    // Handle database constraint errors (fallback)
    if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      if (error.message?.includes('phone') || error.constraint === 'users_phone_unique') {
        return res.status(409).json({
          success: false,
          message: 'This phone number is already registered. You cannot use the same phone number for two accounts.',
        });
      }
      if (error.message?.includes('email') || error.constraint === 'users_email_unique') {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
      }
    }
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = LoginInput.parse(req.body);
    const result = await authService.login(validatedData);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);
    
    res.json({
      success: true,
      message: 'Token is valid',
      data: { user },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid token',
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await authService.getUserById(userId);
    
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = UpdateProfileInput.parse(req.body);
    
    const updatedUser = await authService.updateUserProfile(userId, validatedData);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    
    res.status(400).json({
      success: false,
      message: error.message || 'Profile update failed',
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = ChangePasswordInput.parse(req.body);
    
    await authService.changePassword(userId, validatedData.currentPassword, validatedData.newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Password change error:', error);
    
    res.status(400).json({
      success: false,
      message: error.message || 'Password change failed',
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token. However, if you have a token blacklist,
    // you would add the token to it here.
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const result = await authService.requestPasswordReset(email);
    
    res.json(result);
  } catch (error: any) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process password reset request',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required',
      });
    }

    const result = await authService.resetPassword(email, otp, newPassword);
    
    res.json(result);
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed',
    });
  }
};
