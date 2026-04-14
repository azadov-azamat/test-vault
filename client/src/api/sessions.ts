import { api } from "@/lib/api";
import type { StartExamResponse, FinishResult } from "@/types";

export async function startExam(examId: string, variantNumber: number) {
  const { data } = await api.post<StartExamResponse>(`/student/exams/${examId}/start`, {
    variantNumber,
  });
  return data;
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  selectedAnswer: "a" | "b" | "c" | "d"
) {
  const { data } = await api.post<{ answer: { id: string; isCorrect: boolean } }>(
    `/student/sessions/${sessionId}/answer`,
    { questionId, selectedAnswer }
  );
  return data.answer;
}

export async function finishExam(sessionId: string) {
  const { data } = await api.post<{ result: FinishResult }>(
    `/student/sessions/${sessionId}/finish`
  );
  return data.result;
}
