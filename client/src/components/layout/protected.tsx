"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/types";

export function Protected({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) {
      router.replace(user.role === "teacher" ? "/teacher/dashboard" : "/student/exams");
    }
  }, [user, isReady, role, router]);

  if (!isReady || !user || user.role !== role) {
    return (
      <div className="container py-10 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return <>{children}</>;
}
