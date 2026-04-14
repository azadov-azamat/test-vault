import { api } from "@/lib/api";
import type { AuthResponse } from "@/types";

export async function login(identifier: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/login", { identifier, password });
  return data;
}

export async function registerTeacher(fullName: string, email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/register", { fullName, email, password });
  return data;
}
