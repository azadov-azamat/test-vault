"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getExamResults } from "@/api/exams";
import { useLang } from "@/i18n/context";
import { formatDate } from "@/lib/utils";

export default function ExamResultsPage({ params }: { params: { id: string } }) {
  const { t } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ["exam-results", params.id],
    queryFn: () => getExamResults(params.id),
  });

  const completed = data?.results.filter((r) => r.finishedAt) ?? [];
  const inProgress = (data?.results.length ?? 0) - completed.length;
  const avg = completed.length
    ? Math.round(completed.reduce((s, r) => s + r.percentage, 0) / completed.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/teacher/exams"><ArrowLeft className="h-4 w-4" /> {t.exams}</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{data?.exam.title || t.loading}</h1>
        <p className="text-muted-foreground">{t.examResults.studentsResults}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatBlock title={t.examResults.completed} value={completed.length} icon={<Trophy className="h-5 w-5 text-emerald-500" />} loading={isLoading} />
        <StatBlock title={t.examResults.inProgress} value={inProgress} icon={<Users2 className="h-5 w-5 text-amber-500" />} loading={isLoading} />
        <StatBlock title={t.examResults.avgScore} value={`${avg}%`} icon={<Trophy className="h-5 w-5 text-primary" />} loading={isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.examResults.sessions}</CardTitle>
          <CardDescription>{t.examResults.eachStudentResult}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data?.results.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t.examResults.noSubmissions}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.examResults.student}</TableHead>
                  <TableHead>{t.variant}</TableHead>
                  <TableHead>{t.examResults.status}</TableHead>
                  <TableHead>{t.examResults.correctTotal}</TableHead>
                  <TableHead>{t.examResults.result}</TableHead>
                  <TableHead>{t.examResults.started}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.results.map((r) => (
                  <TableRow key={r.sessionId}>
                    <TableCell>
                      <div className="font-medium">{r.student.fullName}</div>
                      <div className="text-xs text-muted-foreground">{r.student.login}</div>
                    </TableCell>
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
                    <TableCell className="text-muted-foreground">{formatDate(r.startedAt)}</TableCell>
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

function StatBlock({ title, value, icon, loading }: { title: string; value: number | string; icon: React.ReactNode; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{value}</div>}
      </CardContent>
    </Card>
  );
}
