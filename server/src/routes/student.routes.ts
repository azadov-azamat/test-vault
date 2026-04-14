import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireStudent } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getStudentExams,
  getExamVariants,
  startExam,
  submitAnswer,
  finishExam,
  getSessionResult,
} from '../controllers/test.controller';

const router = Router();

router.use(authenticateToken, requireStudent);

router.get('/exams', getStudentExams);
router.get('/exams/:id/variants', getExamVariants);

router.post(
  '/exams/:id/start',
  [body('variantNumber').isInt({ min: 1 }).withMessage("Variant raqami noto'g'ri")],
  validate,
  startExam
);

router.post(
  '/sessions/:id/answer',
  [
    body('questionId').isUUID().withMessage("Savol ID noto'g'ri"),
    body('selectedAnswer').isIn(['a', 'b', 'c', 'd']).withMessage("Javob a, b, c yoki d bo'lishi kerak"),
  ],
  validate,
  submitAnswer
);

router.post('/sessions/:id/finish', finishExam);
router.get('/sessions/:id/result', getSessionResult);

export default router;
