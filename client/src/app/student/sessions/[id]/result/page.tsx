"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getSessionResult } from "@/api/sessions";
import { useLang } from "@/i18n/context";
import { formatDate } from "@/lib/utils";

export default function StudentSessionResultPage({ params }: { params: { id: string } }) {
  const { t } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ["session-result", params.id],
    queryFn: () => getSessionResult(params.id),
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/student/exams"><ArrowLeft className="h-4 w-4" /> {t.exams}</Link>
      </Button>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {data && (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data.exam.title}</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">V-{data.variantNumber}</Badge>
              <span>{t.result.startedAt(formatDate(data.startedAt))}</span>
              {data.finishedAt && <span>{t.result.finishedAt(formatDate(data.finishedAt))}</span>}
            </div>
          </div>

          <Alert variant={data.percentage >= 50 ? "success" : "destructive"}>
            <Trophy className="h-4 w-4" />
            <AlertTitle>
              {data.finishedAt ? t.result.examFinished : t.result.examInProgress}
            </AlertTitle>
            <AlertDescription>{t.result.yourResultBelow}</AlertDescription>
          </Alert>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold">{data.percentage}%</CardTitle>
              <CardDescription>{t.result.overallResult}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label={t.result.totalQuestions} value={data.totalQuestions} />
              <Row label={t.result.correctAnswers} value={data.correct} />
              <Row label={t.result.incorrectAnswers} value={data.incorrect} />
              <Progress value={data.percentage} className="mt-4" />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button asChild>
              <Link href="/student/exams">{t.result.examsList}</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
