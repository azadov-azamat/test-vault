import { Response } from 'express';
import { AuthRequest } from '../types';
import { Exam, Question, ExamSession, Answer, User } from '../models';
import { t, getLang } from '../services/i18n';

export async function getStudentExams(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const student = await User.findOne({ where: { id: req.userId!, role: 'student' } });
    if (!student || !student.teacherId) {
      return res.status(404).json({ error: t('student.not_found', lang) });
    }

    const exams = await Exam.findAll({
      where: { teacherId: student.teacherId },
      attributes: ['id', 'title', 'variantCount', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    res.json({ exams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function getExamVariants(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: t('exam.not_found', lang) });
    }

    const variants = [];
    for (let i = 1; i <= exam.variantCount; i++) {
      const count = await Question.count({
        where: { examId: exam.id, variantNumber: i },
      });
      variants.push({ variantNumber: i, questionCount: count });
    }

    res.json({ exam: { id: exam.id, title: exam.title }, variants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function startExam(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const { variantNumber } = req.body;
    const examId = req.params.id;

    const exam = await Exam.findByPk(examId);
    if (!exam) {
      return res.status(404).json({ error: t('exam.not_found', lang) });
    }

    if (variantNumber < 1 || variantNumber > exam.variantCount) {
      return res.status(400).json({ error: t('validation.variant_invalid', lang) });
    }

    const existingSession = await ExamSession.findOne({
      where: { studentId: req.userId!, examId, finishedAt: null },
    });

    if (existingSession) {
      return res.status(400).json({
        error: t('session.active_exists', lang),
        sessionId: existingSession.id,
      });
    }

    const session = await ExamSession.create({
      studentId: req.userId!,
      examId,
      variantNumber,
    });

    const questions = await Question.findAll({
      where: { examId, variantNumber },
      attributes: ['id', 'questionOrder', 'questionText', 'optionA', 'optionB', 'optionC', 'optionD'],
      order: [['questionOrder', 'ASC']],
    });

    res.status(201).json({ sessionId: session.id, questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function submitAnswer(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const { questionId, selectedAnswer } = req.body;
    const sessionId = req.params.id;

    const session = await ExamSession.findOne({
      where: { id: sessionId, studentId: req.userId!, finishedAt: null },
    });

    if (!session) {
      return res.status(404).json({ error: t('session.not_found', lang) });
    }

    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ error: t('session.question_not_found', lang) });
    }

    const existingAnswer = await Answer.findOne({
      where: { sessionId, questionId },
    });

    if (existingAnswer) {
      return res.status(400).json({ error: t('session.already_answered', lang) });
    }

    const isCorrect = selectedAnswer.toLowerCase() === question.correctAnswer;

    const answer = await Answer.create({
      sessionId,
      questionId,
      selectedAnswer: selectedAnswer.toLowerCase(),
      isCorrect,
    });

    res.status(201).json({ answer: { id: answer.id, isCorrect } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function finishExam(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const sessionId = req.params.id;

    const session = await ExamSession.findOne({
      where: { id: sessionId, studentId: req.userId!, finishedAt: null },
      include: [{ model: Answer, as: 'answers' }],
    });

    if (!session) {
      return res.status(404).json({ error: t('session.not_found', lang) });
    }

    await session.update({ finishedAt: new Date() });

    const answers = (session as any).answers;
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((a: any) => a.isCorrect).length;
    const percentage = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    res.json({
      result: {
        totalQuestions: totalAnswers,
        correct: correctAnswers,
        incorrect: totalAnswers - correctAnswers,
        percentage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}
