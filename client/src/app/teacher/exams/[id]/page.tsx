"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, CheckCircle2, FileText, Clock, CalendarClock, Lock, Unlock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getExam, updateExamSchedule } from "@/api/exams";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/context";
import { extractError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Question } from "@/types";

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function ExamDetailsPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ["exam", params.id],
    queryFn: () => getExam(params.id),
  });

  const [startsAt, setStartsAt] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    if (!data) return;
    setStartsAt(toLocalInput(data.startsAt));
    setDuration(data.durationMinutes ? String(data.durationMinutes) : "");
  }, [data?.id, data?.startsAt, data?.durationMinutes]);

  const updateM = useMutation({
    mutationFn: (payload: { startsAt?: string | null; durationMinutes?: number | null; isFrozen?: boolean }) =>
      updateExamSchedule(params.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam", params.id] });
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast({ title: t.examDetails.examUpdated });
    },
    onError: (e) => toast({ variant: "destructive", title: t.error, description: extractError(e) }),
  });

  const saveSchedule = () => {
    updateM.mutate({
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      durationMinutes: duration === "" ? null : Number(duration),
    });
  };

  const toggleFreeze = () => {
    updateM.mutate({ isFrozen: !data?.isFrozen });
  };

  const variants = useMemo(() => {
    if (!data) return [];
    const grouped = new Map<number, Question[]>();
    for (const q of data.questions) {
      if (!grouped.has(q.variantNumber)) grouped.set(q.variantNumber, []);
      grouped.get(q.variantNumber)!.push(q);
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([variantNumber, questions]) => ({
        variantNumber,
        questions: questions.sort((x, y) => x.questionOrder - y.questionOrder),
      }));
  }, [data]);

  const first = variants[0]?.variantNumber ?? 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/teacher/exams"><ArrowLeft className="h-4 w-4" /> {t.exams}</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{data?.title || t.loading}</h1>
              {data?.isFrozen && <Badge variant="destructive">{t.examDetails.frozen}</Badge>}
            </div>
            {data && (
              <p className="text-sm text-muted-foreground">
                {data.variantCount} {t.variant} • {data.questions?.length ?? 0} {t.question}
                {data.originalFilename && <> • {data.originalFilename}</>}
                {data.createdAt && <> • {formatDate(data.createdAt)}</>}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={data?.isFrozen ? "default" : "outline"}
              onClick={toggleFreeze}
              disabled={updateM.isPending || !data}
            >
              {data?.isFrozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {data?.isFrozen ? t.examDetails.unfreeze : t.examDetails.freeze}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/teacher/exams/${params.id}/results`}>
                <BarChart3 className="h-4 w-4" /> {t.results}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {data?.isFrozen && (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>{t.examDetails.frozenTitle}</AlertTitle>
          <AlertDescription>{t.examDetails.frozenDescription}</AlertDescription>
        </Alert>
      )}

      {data && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" /> {t.examDetails.scheduleTitle}
            </CardTitle>
            <CardDescription>{t.examDetails.scheduleDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" /> {t.examDetails.startTime}
                </Label>
                <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  {data.startsAt ? t.examDetails.currentStartTime(formatDate(data.startsAt)) : t.examDetails.noStartTimeLimit}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>{t.examDetails.totalTime}</Label>
                <Input
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder={t.examDetails.noTimeLimit}
                />
                <p className="text-xs text-muted-foreground">
                  {data.durationMinutes ? t.examDetails.currentDuration(data.durationMinutes) : t.examDetails.unlimited}
                </p>
              </div>
            </div>
            <Button onClick={saveSchedule} disabled={updateM.isPending}>
              <Save className="h-4 w-4" /> {updateM.isPending ? t.saving : t.examDetails.saveSchedule}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && variants.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t.examDetails.noQuestions}</p>
          </CardContent>
        </Card>
      )}

      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.examDetails.questionsTitle}</CardTitle>
            <CardDescription>{t.examDetails.questionsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={String(first)}>
              <TabsList className="flex-wrap h-auto">
                {variants.map((v) => (
                  <TabsTrigger key={v.variantNumber} value={String(v.variantNumber)}>
                    {t.variant} {v.variantNumber}
                    <Badge variant="secondary" className="ml-2">{v.questions.length}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              {variants.map((v) => (
                <TabsContent key={v.variantNumber} value={String(v.variantNumber)} className="space-y-4">
                  {v.questions.map((q) => (
                    <QuestionCard key={q.id} q={q} />
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuestionCard({ q }: { q: Question }) {
  const { t } = useLang();
  const options: Array<{ key: "a" | "b" | "c" | "d"; text: string | null }> = [
    { key: "a", text: q.optionA },
    { key: "b", text: q.optionB },
    { key: "c", text: q.optionC ?? null },
    { key: "d", text: q.optionD ?? null },
  ];
  return (
    <div className="rounded-md border p-4">
      <div className="mb-2 flex items-start gap-2">
        <Badge variant="outline" className="shrink-0">{q.questionOrder}</Badge>
        <p className="whitespace-pre-wrap text-sm font-medium">{q.questionText}</p>
      </div>
      <div className="mt-2 grid gap-1.5 pl-8 text-sm sm:grid-cols-2">
        {options.filter((o) => o.text).map((o) => {
          const correct = q.correctAnswer && o.key === q.correctAnswer.toLowerCase();
          return (
            <div
              key={o.key}
              className={cn(
                "flex items-start gap-2 rounded px-2 py-1",
                correct && "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/30"
              )}
            >
              <span className="font-semibold uppercase">{o.key})</span>
              <span className="flex-1 whitespace-pre-wrap">{o.text}</span>
              {correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
