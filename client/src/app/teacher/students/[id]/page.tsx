"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy, Users2, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStudentById } from "@/api/students";
import { useLang } from "@/i18n/context";
import { formatDate } from "@/lib/utils";

export default function StudentDetailsPage({ params }: { params: { id: string } }) {
  const { t } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ["student", params.id],
    queryFn: () => getStudentById(params.id),
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const completed = data.results.filter((r) => r.finishedAt);
    const inProgress = data.results.length - completed.length;
    const avg = completed.length
      ? Math.round(completed.reduce((s, r) => s + r.percentage, 0) / completed.length)
      : 0;
    const best = completed.length
      ? Math.max(...completed.map((r) => r.percentage))
      : 0;
    return { totalSessions: data.results.length, completed: completed.length, inProgress, avg, best };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/teacher/students"><ArrowLeft className="h-4 w-4" /> {t.students.title}</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{data?.student.fullName || t.loading}</h1>
        {data && (
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <code className="rounded bg-muted px-2 py-0.5">{data.student.login}</code>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {formatDate(data.student.createdAt)}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatBlock title={t.studentDetails.totalSessions} value={stats.totalSessions} icon={<FileText className="h-5 w-5 text-primary" />} />
            <StatBlock title={t.studentDetails.completed} value={stats.completed} icon={<Trophy className="h-5 w-5 text-emerald-500" />} />
            <StatBlock title={t.studentDetails.inProgress} value={stats.inProgress} icon={<Users2 className="h-5 w-5 text-amber-500" />} />
            <StatBlock title={t.studentDetails.avgBest} value={`${stats.avg}% / ${stats.best}%`} icon={<Trophy className="h-5 w-5 text-primary" />} />
          </div>
        )
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.studentDetails.resultsTitle}</CardTitle>
          <CardDescription>{t.studentDetails.resultsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.results.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t.studentDetails.noExamsYet}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.studentDetails.examCol}</TableHead>
                  <TableHead>{t.studentDetails.variantCol}</TableHead>
                  <TableHead>{t.studentDetails.statusCol}</TableHead>
                  <TableHead>{t.studentDetails.correctTotalCol}</TableHead>
                  <TableHead>{t.studentDetails.resultCol}</TableHead>
                  <TableHead>{t.studentDetails.dateCol}</TableHead>
                  <TableHead className="text-right">{t.studentDetails.actionCol}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results.map((r) => (
                  <TableRow key={r.sessionId}>
                    <TableCell className="font-medium">{r.exam.title}</TableCell>
                    <TableCell><Badge variant="secondary">V-{r.variantNumber}</Badge></TableCell>
                    <TableCell>
                      {r.finishedAt
                        ? <Badge variant="success">{t.examResults.statusCompleted}</Badge>
                        : <Badge variant="warning">{t.examResults.statusInProgress}</Badge>}
                    </TableCell>
                    <TableCell>{r.correct} / {r.totalQuestions}</TableCell>
                    <TableCell className="w-48">
                      <div className="flex items-center gap-2">
                        <Progress value={r.percentage} />
                        <span className="w-10 text-right text-sm font-medium">{r.percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(r.startedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/teacher/exams/${r.exam.id}/results`}>{t.exam}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBlock({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
