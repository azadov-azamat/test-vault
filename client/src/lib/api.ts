import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { authStorage } from "./auth-storage";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = authStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const lang = typeof window !== "undefined" ? localStorage.getItem("tv_lang") : null;
  if (lang) config.headers["Accept-Language"] = lang;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const refreshToken = authStorage.getRefresh();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    authStorage.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    authStorage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 403 && !original._retry && authStorage.getRefresh()) {
      original._retry = true;
      if (!refreshing) refreshing = refreshTokens().finally(() => { refreshing = null; });
      const token = await refreshing;
      if (token) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
        return api.request(original);
      }
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function extractError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { error?: string; errors?: { msg: string }[] } | undefined;
    if (data?.error) return data.error;
    if (data?.errors?.length) return data.errors.map((x) => x.msg).join(", ");
    return e.message;
  }
  return "Noma'lum xatolik";
}
