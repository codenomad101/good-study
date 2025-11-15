import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq, or, and, gt } from 'drizzle-orm';
import { db } from '../db';
import { users, passwordResetTokens, type NewUser, type User, type NewPasswordResetToken } from '../db/schema';
import { emailService } from './email';

const JWT_SECRET = process.env.JWT_SECRET!;

export class AuthService {
  async register(userData: {
    username?: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    role?: 'admin' | 'student' | 'moderator';
  }) {
    const { username, email, password, fullName, phone, dateOfBirth, gender, role = 'student' } = userData;

    // Check if user already exists by email or username
    const existingUser = await db.select().from(users).where(
      or(
        eq(users.email, email),
        username ? eq(users.username, username) : undefined
      )
    ).limit(1);
    
    if (existingUser.length > 0) {
      throw new Error('User with this email or username already exists');
    }

    // Check if phone number is already in use (if provided)
    if (phone) {
      const existingPhone = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
      if (existingPhone.length > 0) {
        throw new Error('This phone number is already registered. You cannot use the same phone number for two accounts.');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser: NewUser = {
      username,
      email,
      passwordHash: hashedPassword,
      fullName,
      role,
      phone,
      dateOfBirth,
      gender,
      isActive: true,
      isVerified: false,
      totalPoints: 0,
      level: 1,
      coins: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalStudyTimeMinutes: 0,
    };

    const createdUser = await db.insert(users).values(newUser).returning();

    // Generate JWT token
    const token = jwt.sign(
      { userId: createdUser[0].userId, email: createdUser[0].email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { passwordHash: _, ...userWithoutPassword } = createdUser[0];

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(credentials: { emailOrUsername: string; password: string }) {
    const { emailOrUsername, password } = credentials;

    // Find user by email or username
    const user = await db.select().from(users).where(
      or(
        eq(users.email, emailOrUsername),
        eq(users.username, emailOrUsername)
      )
    ).limit(1);
    
    if (user.length === 0) {
      throw new Error('Invalid email/username or password');
    }

    const foundUser = user[0];

    // Check if user is active
    if (!foundUser.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, foundUser.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email/username or password');
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.userId, foundUser.userId));

    // Generate JWT token
    const token = jwt.sign(
      { userId: foundUser.userId, email: foundUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { passwordHash: _, ...userWithoutPassword } = foundUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      
      const user = await db.select().from(users).where(eq(users.userId, decoded.userId)).limit(1);
      
      if (user.length === 0) {
        throw new Error('User not found');
      }

      const foundUser = user[0];

      if (!foundUser.isActive) {
        throw new Error('Account is deactivated');
      }

      const { passwordHash: _, ...userWithoutPassword } = foundUser;
      return userWithoutPassword;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async updateUserProfile(userId: string, updateData: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    profilePictureUrl?: string;
  }) {
    try {
      const updatedUser = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.userId, userId))
        .returning();

      if (!updatedUser[0]) {
        throw new Error('User not found');
      }

      const { passwordHash: _, ...userWithoutPassword } = updatedUser[0];
      return userWithoutPassword;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Get current user
      const user = await db.select().from(users).where(eq(users.userId, userId)).limit(1);

      if (user.length === 0) {
        throw new Error('User not found');
      }

      const foundUser = user[0];

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, foundUser.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.userId, userId));
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
      return user[0] || null;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updateData: {
    fullName?: string;
    phone?: string;
    profilePictureUrl?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    preferredLanguage?: string;
  }) {
    try {
      const updatedUser = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.userId, userId))
        .returning();

      if (!updatedUser[0]) {
        throw new Error('User not found');
      }

      const { passwordHash: _, ...userWithoutPassword } = updatedUser[0];
      return userWithoutPassword;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  /**
   * Request password reset - generates OTP and sends email
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by email
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (user.length === 0) {
        // Don't reveal if email exists or not for security
        return { success: true, message: 'If the email exists, a password reset OTP has been sent.' };
      }

      const userData = user[0];

      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiration to 15 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Invalidate any existing unused tokens for this user
      await db.update(passwordResetTokens)
        .set({ used: true })
        .where(
          and(
            eq(passwordResetTokens.userId, userData.userId),
            eq(passwordResetTokens.used, false)
          )
        );

      // Create new password reset token
      const resetToken: NewPasswordResetToken = {
        userId: userData.userId,
        token,
        otp,
        expiresAt,
        used: false,
      };

      await db.insert(passwordResetTokens).values(resetToken);

      // Send OTP email
      const emailSent = await emailService.sendPasswordResetOTP(
        userData.email,
        otp,
        userData.fullName
      );

      if (!emailSent) {
        console.error('Failed to send password reset email');
        // Still return success to not reveal if email exists
        return { success: true, message: 'If the email exists, a password reset OTP has been sent.' };
      }

      return { success: true, message: 'Password reset OTP has been sent to your email.' };
    } catch (error) {
      console.error('Password reset request error:', error);
      throw new Error('Failed to process password reset request');
    }
  }

  /**
   * Verify OTP and reset password
   */
  async resetPasswordWithOTP(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by email
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (user.length === 0) {
        throw new Error('Invalid email or OTP');
      }

      const userData = user[0];

      // Find valid, unused token with matching OTP
      const now = new Date();
      const tokenRecord = await db.select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, userData.userId),
            eq(passwordResetTokens.otp, otp),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, now)
          )
        )
        .limit(1);

      if (tokenRecord.length === 0) {
        throw new Error('Invalid or expired OTP');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await db.update(users)
        .set({ 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.userId, userData.userId));

      // Mark token as used
      await db.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.tokenId, tokenRecord[0].tokenId));

      return { success: true, message: 'Password has been reset successfully.' };
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Reset password using token (alternative method with link)
   */
  async resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find valid, unused token
      const now = new Date();
      const tokenRecord = await db.select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expiresAt, now)
          )
        )
        .limit(1);

      if (tokenRecord.length === 0) {
        throw new Error('Invalid or expired reset token');
      }

      const resetToken = tokenRecord[0];

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await db.update(users)
        .set({ 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.userId, resetToken.userId));

      // Mark token as used
      await db.update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.tokenId, resetToken.tokenId));

      return { success: true, message: 'Password has been reset successfully.' };
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }
}