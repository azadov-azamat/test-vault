import { api } from "@/lib/api";
import type {
  Exam,
  ExamWithQuestions,
  ExamResult,
  CreateExamResponse,
  ExamPreview,
  PreviewVariant,
  Variant,
} from "@/types";

export async function getExams() {
  const { data } = await api.get<{ exams: Exam[] }>("/teacher/exams");
  return data.exams;
}

export async function getExam(id: string) {
  const { data } = await api.get<{ exam: ExamWithQuestions }>(`/teacher/exams/${id}`);
  return data.exam;
}

export async function getExamResults(id: string) {
  const { data } = await api.get<{ exam: { id: string; title: string }; results: ExamResult[] }>(
    `/teacher/exams/${id}/results`
  );
  return data;
}

export async function previewExamFile(payload: { file: File; variantCount: number }) {
  const form = new FormData();
  form.append("variantCount", String(payload.variantCount));
  form.append("file", payload.file);
  const { data } = await api.post<{ preview: ExamPreview }>("/teacher/exams/preview", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.preview;
}

export async function createExam(payload: {
  title: string;
  variantCount: number;
  originalFilename: string;
  variants: PreviewVariant[];
  startsAt?: string | null;
  durationMinutes?: number | null;
  minutesPerQuestion?: number | null;
}) {
  const { data } = await api.post<CreateExamResponse>("/teacher/exams", payload);
  return data.exam;
}

export async function updateExamSchedule(
  id: string,
  payload: {
    title?: string;
    startsAt?: string | null;
    durationMinutes?: number | null;
    isFrozen?: boolean;
  }
) {
  const { data } = await api.patch<{ exam: Exam }>(`/teacher/exams/${id}`, payload);
  return data.exam;
}

export async function deleteExam(id: string) {
  await api.delete(`/teacher/exams/${id}`);
}

export async function getStudentExams() {
  const { data } = await api.get<{ exams: Exam[] }>("/student/exams");
  return data.exams;
}

export async function getVariants(examId: string) {
  const { data } = await api.get<{
    exam: {
      id: string;
      title: string;
      startsAt: string | null;
      durationMinutes: number | null;
      isFrozen: boolean;
    };
    variants: Variant[];
  }>(`/student/exams/${examId}/variants`);
  return data;
}
