import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth';

const authService = new AuthService();
const JWT_SECRET = process.env.JWT_SECRET!;

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('[Auth Middleware] Request details:', {
      method: req.method,
      path: req.path,
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader ? (authHeader.substring(0, 20) + '...') : 'none'
    });
    
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.warn('[Auth Middleware] No token found in request');
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    console.log('[Auth Middleware] Token found, verifying...');
    
    // Verify token and get user
    const user = await authService.verifyToken(token);
    
    console.log('[Auth Middleware] Token verified successfully for user:', user?.userId);
    
    // Add user to request object
    (req as any).user = user;
    
    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Authentication error:', {
      message: error.message,
      stack: error.stack,
      method: req.method,
      path: req.path
    });
    
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const user = await authService.verifyToken(token);
        (req as any).user = user;
      } catch (error) {
        // Token is invalid, but we continue without user
        (req as any).user = null;
      }
    } else {
      (req as any).user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    (req as any).user = null;
    next();
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }
    
    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status',
    });
  }
};