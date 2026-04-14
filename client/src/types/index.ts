export type Role = "teacher" | "student";

export interface User {
  id: string;
  role: Role;
  fullName: string;
  email?: string | null;
  login?: string | null;
}

export interface AuthResponse {
  user: User;
  role: Role;
  accessToken: string;
  refreshToken: string;
}

export interface Exam {
  id: string;
  teacherId: string;
  title: string;
  variantCount: number;
  originalFilename?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Question {
  id: string;
  examId: string;
  variantNumber: number;
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: "a" | "b" | "c" | "d";
}

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

export interface Student {
  id: string;
  fullName: string;
  login: string;
  password: string | null;
  createdAt: string;
}

export interface CreatedStudent {
  id: string;
  fullName: string;
  login: string;
  password: string;
}

export interface Variant {
  variantNumber: number;
  questionCount: number;
}

export interface ExamResult {
  sessionId: string;
  student: { id: string; fullName: string; login: string };
  variantNumber: number;
  startedAt: string;
  finishedAt: string | null;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  percentage: number;
}

export interface StudentExamResult {
  sessionId: string;
  exam: { id: string; title: string; variantCount: number };
  variantNumber: number;
  startedAt: string;
  finishedAt: string | null;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  percentage: number;
}

export interface StudentDetails {
  student: {
    id: string;
    fullName: string;
    login: string;
    password: string | null;
    createdAt: string;
  };
  results: StudentExamResult[];
}

export interface PreviewQuestion {
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string;
}

export interface PreviewVariant {
  variantNumber: number;
  questions: PreviewQuestion[];
}

export interface ExamPreview {
  suggestedTitle: string;
  originalFilename: string;
  variantCount: number;
  totalQuestions: number;
  questionsPerVariant: number;
  discardedQuestions: number;
  stats: { detected: number; withoutCorrectAnswer: number; incomplete: number };
  variants: PreviewVariant[];
}

export interface CreateExamResponse {
  exam: {
    id: string;
    title: string;
    variantCount: number;
    totalQuestions: number;
    questionsPerVariant: number;
  };
}

export interface StartExamResponse {
  sessionId: string;
  questions: Omit<Question, "correctAnswer" | "examId" | "variantNumber">[];
}

export interface FinishResult {
  totalQuestions: number;
  correct: number;
  incorrect: number;
  percentage: number;
}
