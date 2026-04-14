"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, Users, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getExams } from "@/api/exams";
import { getStudents } from "@/api/students";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/i18n/context";
import { formatDate } from "@/lib/utils";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const exams = useQuery({ queryKey: ["exams"], queryFn: getExams });
  const students = useQuery({ queryKey: ["students"], queryFn: getStudents });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.greeting(user?.fullName ?? "")}</h1>
        <p className="text-muted-foreground">{t.dashboard.welcome}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title={t.dashboard.examsCount}
          icon={<FileText className="h-5 w-5 text-primary" />}
          value={exams.data?.length}
          loading={exams.isLoading}
          href="/teacher/exams"
        />
        <StatCard
          title={t.dashboard.studentsCount}
          icon={<Users className="h-5 w-5 text-primary" />}
          value={students.data?.length}
          loading={students.isLoading}
          href="/teacher/students"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t.dashboard.recentExams}</CardTitle>
              <CardDescription>{t.dashboard.recentExamsDescription}</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/teacher/exams/new"><Plus className="h-4 w-4" /> {t.dashboard.new}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {exams.isLoading && <Skeleton className="h-24 w-full" />}
            {exams.data?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.noExamsYet}</p>
            )}
            {exams.data?.slice(0, 5).map((e) => (
              <Link
                key={e.id}
                href={`/teacher/exams/${e.id}/results`}
                className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.variantCount} {t.variant} • {formatDate(e.createdAt)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.dashboard.quickActions}</CardTitle>
            <CardDescription>{t.dashboard.quickActionsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/teacher/exams/new"><Plus className="h-4 w-4" /> {t.dashboard.newExam}</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/teacher/students"><Users className="h-4 w-4" /> {t.dashboard.addStudent}</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/teacher/exams"><FileText className="h-4 w-4" /> {t.dashboard.allExams}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon, loading, href,
}: { title: string; value?: number; icon: React.ReactNode; loading: boolean; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{value ?? 0}</div>}
        </CardContent>
      </Card>
    </Link>
  );
}
