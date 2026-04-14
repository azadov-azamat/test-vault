import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: 'teacher' | 'student';
}

export interface ParsedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string;
}

export interface VariantQuestion extends ParsedQuestion {
  variantNumber: number;
  questionOrder: number;
}
