import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireTeacher } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  previewExam,
  createExam,
  updateExam,
  deleteExam,
  getExams,
  getExamById,
  getExamResults,
} from '../controllers/exam.controller';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from '../controllers/student.controller';
import upload from '../middleware/upload';

const router = Router();

router.use(authenticateToken, requireTeacher);

router.post('/exams/preview', upload.single('file') as any, previewExam as any);
router.post('/exams', createExam);
router.get('/exams', getExams);
router.get('/exams/:id', getExamById);
router.patch('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);
router.get('/exams/:id/results', getExamResults);

router.post(
  '/students',
  [body('fullName').trim().notEmpty().withMessage("To'liq ism kiritilishi shart")],
  validate,
  createStudent
);
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.patch('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

export default router;
