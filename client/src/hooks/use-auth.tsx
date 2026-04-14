"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth-storage";
import type { AuthResponse, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  setSession: (r: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(authStorage.getUser());
    setIsReady(true);
  }, []);

  const setSession = useCallback((r: AuthResponse) => {
    authStorage.setSession(r.accessToken, r.refreshToken, r.user);
    setUser(r.user);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isReady, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
