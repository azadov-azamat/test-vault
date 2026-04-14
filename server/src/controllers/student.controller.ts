import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../types';
import { User, ExamSession, Exam, Answer } from '../models';
import { t, getLang } from '../services/i18n';

function generateLogin(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let login = 'stv_';
  for (let i = 0; i < 6; i++) {
    login += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return login;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function createStudent(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const { fullName } = req.body;
    const login = generateLogin();
    const plainPassword = generatePassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const student = await User.create({
      role: 'student',
      teacherId: req.userId!,
      fullName,
      login,
      passwordHash,
      plainPassword,
    });

    res.status(201).json({
      student: {
        id: student.id,
        fullName: student.fullName,
        login: student.login,
        password: plainPassword,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function getStudents(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const students = await User.findAll({
      where: { role: 'student', teacherId: req.userId! },
      attributes: ['id', 'fullName', 'login', 'plainPassword', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json({
      students: students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        login: s.login,
        password: s.plainPassword,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

async function findOwnedStudent(teacherId: string, studentId: string) {
  return User.findOne({
    where: { id: studentId, role: 'student', teacherId },
  });
}

export async function getStudentById(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const student = await findOwnedStudent(req.userId!, req.params.id);
    if (!student) {
      return res.status(404).json({ error: t('student.not_found', lang) });
    }

    const sessions = await ExamSession.findAll({
      where: { studentId: student.id },
      include: [
        { model: Exam, as: 'exam', attributes: ['id', 'title', 'variantCount'] },
        { model: Answer, as: 'answers', attributes: ['isCorrect'] },
      ],
      order: [['startedAt', 'DESC']],
    });

    const results = sessions.map((s: any) => {
      const total = s.answers.length;
      const correct = s.answers.filter((a: any) => a.isCorrect).length;
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        sessionId: s.id,
        exam: s.exam,
        variantNumber: s.variantNumber,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
        totalQuestions: total,
        correct,
        incorrect: total - correct,
        percentage,
      };
    });

    res.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        login: student.login,
        password: student.plainPassword,
        createdAt: student.createdAt,
      },
      results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function updateStudent(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const student = await findOwnedStudent(req.userId!, req.params.id);
    if (!student) {
      return res.status(404).json({ error: t('student.not_found', lang) });
    }

    const { fullName, regeneratePassword } = req.body as {
      fullName?: string;
      regeneratePassword?: boolean;
    };

    if (typeof fullName === 'string' && fullName.trim()) {
      student.fullName = fullName.trim();
    }

    let newPassword: string | null = null;
    if (regeneratePassword) {
      newPassword = generatePassword();
      student.passwordHash = await bcrypt.hash(newPassword, 10);
      student.plainPassword = newPassword;
    }

    await student.save();

    res.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        login: student.login,
        password: student.plainPassword,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}

export async function deleteStudent(req: AuthRequest, res: Response) {
  const lang = getLang(req.headers['accept-language']);
  try {
    const student = await findOwnedStudent(req.userId!, req.params.id);
    if (!student) {
      return res.status(404).json({ error: t('student.not_found', lang) });
    }
    await student.destroy();
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: t('error.server', lang) });
  }
}
