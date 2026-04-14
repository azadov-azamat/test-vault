import { Response } from 'express';
import path from 'path';
import { AuthRequest } from '../types';
import { Exam, Question, ExamSession, Answer, User } from '../models';
import { parseQuestionsFile } from '../services/file-parser';
import { splitIntoVariants } from '../services/variant-splitter';
import { t, getLang } from '../services/i18n';

function titleFromFilename(filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  return base.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function previewExam(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const { variantCount } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: t('exam.file_required', lang) });
    }

    const count = Number(variantCount);
    if (![2, 4, 6].includes(count)) {
      return res.status(400).json({ error: t('exam.variant_count_invalid', lang) });
    }

    const { questions: parsed, stats } = await parseQuestionsFile(file.buffer, file.originalname);

    if (parsed.length < count) {
      const hint =
        stats.detected > parsed.length
          ? ` (topildi: ${stats.detected}, to'liq: ${parsed.length}, to'g'ri javobsiz: ${stats.withoutCorrectAnswer}, to'liqsiz: ${stats.incomplete})`
          : '';
      return res.status(400).json({
        error: t('exam.not_enough_questions', lang, { count, found: parsed.length }) + hint,
      });
    }

    const variantQuestions = splitIntoVariants(parsed, count);

    const variants = Array.from({ length: count }, (_, i) => {
      const variantNumber = i + 1;
      return {
        variantNumber,
        questions: variantQuestions
          .filter((q) => q.variantNumber === variantNumber)
          .map((q) => ({
            questionOrder: q.questionOrder,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
          })),
      };
    });

    res.json({
      preview: {
        suggestedTitle: titleFromFilename(file.originalname),
        originalFilename: file.originalname,
        variantCount: count,
        totalQuestions: parsed.length,
        questionsPerVariant: Math.floor(parsed.length / count),
        discardedQuestions: parsed.length % count,
        stats,
        variants,
      },
    });
  } catch (error) {
    console.error('Preview xatolik:', error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

interface VariantPayload {
  variantNumber: number;
  questions: Array<{
    questionOrder: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string | null;
    optionD: string | null;
    correctAnswer: string;
  }>;
}

export async function createExam(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const {
      title,
      variantCount,
      originalFilename,
      variants,
      startsAt,
      durationMinutes,
      minutesPerQuestion,
    } = req.body as {
      title?: string;
      variantCount?: number;
      originalFilename?: string;
      variants?: VariantPayload[];
      startsAt?: string | null;
      durationMinutes?: number | null;
      minutesPerQuestion?: number | null;
    };

    const count = Number(variantCount);
    if (![2, 4, 6].includes(count)) {
      return res.status(400).json({ error: t('exam.variant_count_invalid', lang) });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Imtihon nomi kiritilishi shart" });
    }
    if (!Array.isArray(variants) || variants.length !== count) {
      return res.status(400).json({ error: "Variantlar to'liq emas" });
    }

    const total = variants.reduce((s, v) => s + v.questions.length, 0);
    if (total === 0) {
      return res.status(400).json({ error: "Savollar topilmadi" });
    }

    const parsedStartsAt = startsAt ? new Date(startsAt) : null;
    if (startsAt && isNaN(parsedStartsAt!.getTime())) {
      return res.status(400).json({ error: "Boshlanish vaqti noto'g'ri" });
    }

    const exam = await Exam.create({
      teacherId: req.userId!,
      title: title.trim(),
      variantCount: count,
      originalFilename: originalFilename || '',
      startsAt: parsedStartsAt,
      durationMinutes: durationMinutes && durationMinutes > 0 ? Math.floor(durationMinutes) : null,
      minutesPerQuestion: minutesPerQuestion && minutesPerQuestion > 0 ? Math.floor(minutesPerQuestion) : null,
    });

    const rows = variants.flatMap((v) =>
      v.questions.map((q) => ({
        examId: exam.id,
        variantNumber: v.variantNumber,
        questionOrder: q.questionOrder,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: (q.correctAnswer || '').toLowerCase(),
      }))
    );

    await Question.bulkCreate(rows);

    res.status(201).json({
      exam: {
        id: exam.id,
        title: exam.title,
        variantCount: exam.variantCount,
        totalQuestions: rows.length,
        questionsPerVariant: Math.floor(rows.length / count),
      },
    });
  } catch (error) {
    console.error('Exam yaratishda xatolik:', error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function updateExam(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const exam = await Exam.findOne({
      where: { id: req.params.id, teacherId: req.userId! },
    });
    if (!exam) {
      return res.status(404).json({ error: t('exam.not_found', lang) });
    }

    const { title, startsAt, durationMinutes, isFrozen } = req.body as {
      title?: string;
      startsAt?: string | null;
      durationMinutes?: number | null;
      isFrozen?: boolean;
    };

    if (typeof title === 'string' && title.trim()) exam.title = title.trim();

    if (startsAt !== undefined) {
      if (startsAt === null || startsAt === '') {
        exam.startsAt = null;
      } else {
        const d = new Date(startsAt);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: "Boshlanish vaqti noto'g'ri" });
        }
        exam.startsAt = d;
      }
    }

    if (durationMinutes !== undefined) {
      exam.durationMinutes =
        durationMinutes && durationMinutes > 0 ? Math.floor(durationMinutes) : null;
    }

    if (typeof isFrozen === 'boolean') {
      exam.isFrozen = isFrozen;
    }

    await exam.save();
    res.json({ exam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function deleteExam(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const exam = await Exam.findOne({
      where: { id: req.params.id, teacherId: req.userId! },
    });
    if (!exam) {
      return res.status(404).json({ error: t('exam.not_found', lang) });
    }
    await exam.destroy();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function getExams(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const exams = await Exam.findAll({
      where: { teacherId: req.userId! },
      order: [['createdAt', 'DESC']],
    });
    res.json({ exams });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function getExamById(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const exam = await Exam.findOne({
      where: { id: req.params.id, teacherId: req.userId! },
      include: [{
        model: Question,
        as: 'questions',
      }],
      order: [[{ model: Question, as: 'questions' }, 'variantNumber', 'ASC'], [{ model: Question, as: 'questions' }, 'questionOrder', 'ASC']],
    });

    if (!exam) {
      return res.status(404).json({ error: t('exam.not_found', lang) });
    }

    res.json({ exam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function getExamResults(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const exam = await Exam.findOne({
      where: { id: req.params.id, teacherId: req.userId! },
    });

    if (!exam) {
      return res.status(404).json({ error: t('exam.not_found', lang) });
    }

    const sessions = await ExamSession.findAll({
      where: { examId: exam.id },
      include: [
        { model: User, as: 'student', attributes: ['id', 'fullName', 'login'] },
        { model: Answer, as: 'answers' },
      ],
      order: [['startedAt', 'DESC']],
    });

    const results = sessions.map((session: any) => {
      const totalAnswers = session.answers.length;
      const correctAnswers = session.answers.filter((a: any) => a.isCorrect).length;
      const percentage = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

      return {
        sessionId: session.id,
        student: session.student,
        variantNumber: session.variantNumber,
        startedAt: session.startedAt,
        finishedAt: session.finishedAt,
        totalQuestions: totalAnswers,
        correct: correctAnswers,
        incorrect: totalAnswers - correctAnswers,
        percentage,
      };
    });

    res.json({ exam: { id: exam.id, title: exam.title }, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}
