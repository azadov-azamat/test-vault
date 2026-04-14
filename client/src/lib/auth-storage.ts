import type { User } from "@/types";

const ACCESS = "tv_access";
const REFRESH = "tv_refresh";
const USER = "tv_user";

export const authStorage = {
  getAccess: () => (typeof window === "undefined" ? null : localStorage.getItem(ACCESS)),
  getRefresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH)),
  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  },
  setSession(accessToken: string, refreshToken: string, user?: User) {
    localStorage.setItem(ACCESS, accessToken);
    localStorage.setItem(REFRESH, refreshToken);
    if (user) localStorage.setItem(USER, JSON.stringify(user));
  },
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS, accessToken);
    localStorage.setItem(REFRESH, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
  },
};
