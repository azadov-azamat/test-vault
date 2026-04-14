import { Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../types';
import { Exam, Question, ExamSession, Answer, User } from '../models';
import { t, getLang } from '../services/i18n';

interface SessionTiming {
  startedAt: Date;
  durationMinutes: number | null;
  endsAt: Date | null;
  expired: boolean;
}

function computeTiming(session: ExamSession, exam: Exam): SessionTiming {
  const duration = exam.durationMinutes;
  const startedAt = session.startedAt;
  const endsAt = duration ? new Date(startedAt.getTime() + duration * 60_000) : null;
  const expired = !!endsAt && new Date() > endsAt;
  return { startedAt, durationMinutes: duration, endsAt, expired };
}

export async function getStudentExams(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const student = await User.findOne({ where: { id: req.userId!, role: 'student' } });
    if (!student || !student.teacherId) {
      return res.status(404).json({ error: t('student.not_found', lang) });
    }

    const exams = await Exam.findAll({
      where: { teacherId: student.teacherId },
      attributes: [
        'id', 'title', 'variantCount', 'createdAt',
        'startsAt', 'durationMinutes', 'isFrozen',
      ],
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

    // Student'ning ushbu imtihon bo'yicha tugatilgan sessiyalari
    const completed = await ExamSession.findAll({
      where: { examId: exam.id, studentId: req.userId! },
      attributes: ['id', 'variantNumber', 'finishedAt'],
    });

    const variants: Array<{
      variantNumber: number;
      questionCount: number;
      completedSessionId: string | null;
      hasActiveSession: boolean;
    }> = [];

    for (let i = 1; i <= exam.variantCount; i++) {
      const count = await Question.count({
        where: { examId: exam.id, variantNumber: i },
      });
      const sessions = completed.filter((s) => s.variantNumber === i);
      const finished = sessions.find((s) => s.finishedAt);
      const active = sessions.find((s) => !s.finishedAt);
      variants.push({
        variantNumber: i,
        questionCount: count,
        completedSessionId: finished?.id || null,
        hasActiveSession: !!active,
      });
    }

    res.json({
      exam: {
        id: exam.id,
        title: exam.title,
        startsAt: exam.startsAt,
        durationMinutes: exam.durationMinutes,
        isFrozen: exam.isFrozen,
      },
      variants,
    });
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

    if (exam.isFrozen) {
      return res.status(403).json({ error: t('exam.frozen', lang) });
    }

    if (exam.startsAt && new Date() < exam.startsAt) {
      return res.status(403).json({
        error: t('exam.not_started', lang),
        startsAt: exam.startsAt,
      });
    }

    if (variantNumber < 1 || variantNumber > exam.variantCount) {
      return res.status(400).json({ error: t('validation.variant_invalid', lang) });
    }

    // Bu variantni allaqachon topshirganmi?
    const completedReal = await ExamSession.findOne({
      where: {
        studentId: req.userId!,
        examId,
        variantNumber,
        finishedAt: { [Op.ne]: null },
      },
    });
    if (completedReal) {
      return res.status(400).json({
        error: t('session.variant_completed', lang),
        sessionId: completedReal.id,
      });
    }

    // Aktiv sessiya bormi?
    const existingSession = await ExamSession.findOne({
      where: { studentId: req.userId!, examId, variantNumber, finishedAt: null },
    });

    let session: ExamSession;
    if (existingSession) {
      // Agar vaqt tugagan bo'lsa — avto-yakunlash va xabar
      const timing = computeTiming(existingSession, exam);
      if (timing.expired) {
        await existingSession.update({ finishedAt: timing.endsAt || new Date() });
        return res.status(400).json({
          error: t('session.expired', lang),
          sessionId: existingSession.id,
        });
      }
      session = existingSession;
    } else {
      session = await ExamSession.create({
        studentId: req.userId!,
        examId,
        variantNumber,
      });
    }

    const questions = await Question.findAll({
      where: { examId, variantNumber },
      attributes: ['id', 'questionOrder', 'questionText', 'optionA', 'optionB', 'optionC', 'optionD'],
      order: [['questionOrder', 'ASC']],
    });

    // Avvalgi javoblar (agar session davom ettirilsa)
    const previousAnswers = await Answer.findAll({
      where: { sessionId: session.id },
      attributes: ['questionId', 'selectedAnswer'],
    });

    const timing = computeTiming(session, exam);

    res.status(existingSession ? 200 : 201).json({
      sessionId: session.id,
      questions,
      answers: previousAnswers.map((a) => ({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
      })),
      startedAt: timing.startedAt,
      endsAt: timing.endsAt,
      durationMinutes: timing.durationMinutes,
    });
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

    const exam = await Exam.findByPk(session.examId);
    if (!exam) return res.status(404).json({ error: t('exam.not_found', lang) });

    if (exam.isFrozen) {
      return res.status(403).json({ error: t('exam.frozen', lang) });
    }

    const timing = computeTiming(session, exam);
    if (timing.expired) {
      await session.update({ finishedAt: timing.endsAt || new Date() });
      return res.status(410).json({ error: t('session.expired', lang) });
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
        sessionId: session.id,
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

export async function getSessionResult(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const sessionId = req.params.id;
    const session = await ExamSession.findOne({
      where: { id: sessionId, studentId: req.userId! },
      include: [
        { model: Answer, as: 'answers' },
        { model: Exam, as: 'exam', attributes: ['id', 'title'] },
      ],
    });

    if (!session) {
      return res.status(404).json({ error: t('session.not_found', lang) });
    }

    const answers = (session as any).answers || [];
    const total = answers.length;
    const correct = answers.filter((a: any) => a.isCorrect).length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    res.json({
      result: {
        sessionId: session.id,
        exam: (session as any).exam,
        variantNumber: session.variantNumber,
        startedAt: session.startedAt,
        finishedAt: session.finishedAt,
        totalQuestions: total,
        correct,
        incorrect: total - correct,
        percentage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}
