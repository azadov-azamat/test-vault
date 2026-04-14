"use client";

import { FileText } from "lucide-react";
import { Protected } from "@/components/layout/protected";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const nav: NavItem[] = [
  { href: "/student/exams", label: "Mavjud imtihonlar", icon: FileText },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected role="student">
      <AppShell nav={nav}>{children}</AppShell>
    </Protected>
  );
}
