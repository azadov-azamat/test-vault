import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { registerTeacher, login, refreshToken } from '../controllers/auth.controller';

const router = Router();

router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage("To'liq ism kiritilishi shart | Необходимо указать полное имя"),
    body('email').isEmail().withMessage("Email formati noto'g'ri | Неверный формат email"),
    body('password').isLength({ min: 6 }).withMessage("Parol kamida 6 ta belgidan iborat bo'lishi kerak | Пароль должен содержать минимум 6 символов"),
  ],
  validate,
  registerTeacher
);

router.post(
  '/login',
  [
    body('identifier').trim().notEmpty().withMessage('Login yoki email kiritilishi shart | Необходимо указать логин или email'),
    body('password').notEmpty().withMessage('Parol kiritilishi shart | Необходимо указать пароль'),
  ],
  validate,
  login
);

router.post('/refresh', refreshToken);

export default router;
