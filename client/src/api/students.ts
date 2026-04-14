import { api } from "@/lib/api";
import type { Student, CreatedStudent, StudentDetails } from "@/types";

export async function getStudents() {
  const { data } = await api.get<{ students: Student[] }>("/teacher/students");
  return data.students;
}

export async function createStudent(fullName: string) {
  const { data } = await api.post<{ student: CreatedStudent }>("/teacher/students", { fullName });
  return data.student;
}

export async function getStudentById(id: string) {
  const { data } = await api.get<StudentDetails>(`/teacher/students/${id}`);
  return data;
}

export async function updateStudent(id: string, payload: { fullName?: string; regeneratePassword?: boolean }) {
  const { data } = await api.patch<{ student: CreatedStudent }>(`/teacher/students/${id}`, payload);
  return data.student;
}

export async function deleteStudent(id: string) {
  await api.delete(`/teacher/students/${id}`);
}
