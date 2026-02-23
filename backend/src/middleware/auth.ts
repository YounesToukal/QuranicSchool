import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

// Warn loudly if the default insecure secret is still in use
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
if (JWT_SECRET === 'your-secret-key') {
  console.warn(
    '⚠️  WARNING: JWT_SECRET is using the insecure default value. Set a strong secret in your .env file!',
  );
}

export interface AuthRequest extends Request {
  user?: any;
}

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
};

/**
 * authMiddleware
 * - Verifies JWT signature + expiry
 * - Re-checks the user still exists in DB and is not suspended
 *   (catches tokens issued to users who were suspended after login)
 */
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token) as { user: { id: number; role: string } };

    // Live suspension check — ensures suspended users are blocked
    // even if they still hold a valid JWT from before suspension
    const check = await query(
      'SELECT id, is_suspended FROM users WHERE id = $1',
      [decoded.user.id],
    );
    if (check.rows.length === 0) {
      return res.status(401).json({ message: 'Account not found' });
    }
    if (check.rows[0].is_suspended) {
      return res.status(403).json({
        message: 'الحساب موقوف مؤقتاً. يرجى التواصل مع الإدارة',
        suspended: true,
      });
    }

    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const roleMiddleware = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};
