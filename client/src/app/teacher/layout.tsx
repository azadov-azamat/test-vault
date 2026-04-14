"use client";

import { LayoutDashboard, FileText, Users } from "lucide-react";
import { Protected } from "@/components/layout/protected";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const nav: NavItem[] = [
  { href: "/teacher/dashboard", label: "Boshqaruv paneli", icon: LayoutDashboard },
  { href: "/teacher/exams", label: "Imtihonlar", icon: FileText },
  { href: "/teacher/students", label: "O'quvchilar", icon: Users },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected role="teacher">
      <AppShell nav={nav}>{children}</AppShell>
    </Protected>
  );
}
