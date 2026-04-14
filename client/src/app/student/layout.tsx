"use client";

import { FileText } from "lucide-react";
import { Protected } from "@/components/layout/protected";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { useLang } from "@/i18n/context";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLang();

  const nav: NavItem[] = [
    { href: "/student/exams", label: t.studentNav.exams, icon: FileText },
  ];

  return (
    <Protected role="student">
      <AppShell nav={nav}>{children}</AppShell>
    </Protected>
  );
}
