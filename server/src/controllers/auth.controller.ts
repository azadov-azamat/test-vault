import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models';
import { generateTokens } from '../middleware/auth';
import { t, getLang } from '../services/i18n';

function publicUser(user: User) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    login: user.login,
  };
}

export async function registerTeacher(req: Request, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const { fullName, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: t('auth.email_exists', lang) });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const teacher = await User.create({
      role: 'teacher',
      fullName,
      email,
      passwordHash,
    });

    const tokens = generateTokens(teacher.id, 'teacher');
    res.status(201).json({
      user: publicUser(teacher),
      role: 'teacher',
      ...tokens,
    });
  } catch (error) {
    console.error('Register xatolik:', error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function login(req: Request, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const { identifier, password } = req.body;

    // identifier email yoki login bo'lishi mumkin — ikkalasini ham qidiramiz
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { login: identifier },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: t('auth.invalid_credentials', lang) });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: t('auth.invalid_credentials', lang) });
    }

    const tokens = generateTokens(user.id, user.role);
    res.json({
      user: publicUser(user),
      role: user.role,
      ...tokens,
    });
  } catch (error) {
    console.error('Login xatolik:', error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function refreshToken(req: Request, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: t('auth.refresh_required', lang) });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      id: string;
      role: 'teacher' | 'student';
    };

    // Xavfsizlik: token ichidagi rol bilan DB'dagi rol mos kelishi kerak
    const user = await User.findByPk(decoded.id);
    if (!user || user.role !== decoded.role) {
      return res.status(403).json({ error: t('auth.refresh_invalid', lang) });
    }

    const tokens = generateTokens(user.id, user.role);
    res.json(tokens);
  } catch {
    return res.status(403).json({ error: t('auth.refresh_invalid', getLang(req.headers['accept-language'])) });
  }
}
