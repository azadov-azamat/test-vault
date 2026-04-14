import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { t, getLang } from '../services/i18n';

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const lang = getLang(req.headers['accept-language']);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: t('auth.token_missing', lang) });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: 'teacher' | 'student';
    };
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(403).json({ error: t('auth.token_invalid', lang) });
  }
}

export function requireTeacher(req: AuthRequest, res: Response, next: NextFunction) {
  const lang = getLang(req.headers['accept-language']);
  if (req.userRole !== 'teacher') {
    return res.status(403).json({ error: t('auth.teacher_only', lang) });
  }
  next();
}

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction) {
  const lang = getLang(req.headers['accept-language']);
  if (req.userRole !== 'student') {
    return res.status(403).json({ error: t('auth.student_only', lang) });
  }
  next();
}

export function generateTokens(id: string, role: 'teacher' | 'student') {
  const accessToken = jwt.sign({ id, role }, process.env.JWT_SECRET!, {
    expiresIn: '1d',
  });
  const refreshToken = jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
}
