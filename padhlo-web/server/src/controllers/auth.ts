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

export const logout = async (req: Request, res: Response) => {
  try {
    // Since we're using JWT tokens (stateless), logout on the server side
    // doesn't require any action. The client will clear the token from storage.
    // If you want to implement token blacklisting in the future, you can do it here.
    
    res.json({
      success: true,
      message: 'Logout successful',
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
    
    res.json({
      success: result.success,
      message: result.message,
    });
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
    const { email, otp, newPassword, token } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    let result;
    
    // If OTP is provided, use OTP method
    if (otp && email) {
      result = await authService.resetPasswordWithOTP(email, otp, newPassword);
    } 
    // If token is provided, use token method
    else if (token) {
      result = await authService.resetPasswordWithToken(token, newPassword);
    } 
    else {
      return res.status(400).json({
        success: false,
        message: 'Either OTP with email or reset token is required',
      });
    }
    
    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
};