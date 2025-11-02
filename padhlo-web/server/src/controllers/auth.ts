import { Request, Response } from 'express';
import { AuthService } from '../services/auth';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '../schemas/auth';

const authService = new AuthService();

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
    
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
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
    const result = await authService.login({
      emailOrUsername: validatedData.emailOrUsername,
      password: validatedData.password,
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid email/username or password') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }
    
    if (error.message === 'Account is deactivated') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const user = await authService.verifyToken(token);
    
    res.json({
      success: true,
      message: 'Token verified successfully',
      data: { user },
    });
  } catch (error: any) {
    console.error('Token verification error:', error);
    
    res.status(401).json({
      success: false,
      message: 'Invalid token',
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
      data: user,
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
    
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message || 'Password change failed',
    });
  }
};