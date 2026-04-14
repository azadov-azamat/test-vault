"use client";

import { LayoutDashboard, FileText, Users } from "lucide-react";
import { Protected } from "@/components/layout/protected";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { useLang } from "@/i18n/context";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLang();

  const nav: NavItem[] = [
    { href: "/teacher/dashboard", label: t.teacherNav.dashboard, icon: LayoutDashboard },
    { href: "/teacher/exams", label: t.teacherNav.exams, icon: FileText },
    { href: "/teacher/students", label: t.teacherNav.students, icon: Users },
  ];

  return (
    <Protected role="teacher">
      <AppShell nav={nav}>{children}</AppShell>
    </Protected>
  );
}
