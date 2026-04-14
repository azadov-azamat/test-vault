"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getExam } from "@/api/exams";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Question } from "@/types";

export default function ExamDetailsPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useQuery({
    queryKey: ["exam", params.id],
    queryFn: () => getExam(params.id),
  });

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
          <Link href="/teacher/exams"><ArrowLeft className="h-4 w-4" /> Imtihonlar</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data?.title || "Yuklanmoqda..."}</h1>
            {data && (
              <p className="text-sm text-muted-foreground">
                {data.variantCount} variant • {data.questions?.length ?? 0} savol
                {data.originalFilename && <> • {data.originalFilename}</>}
                {data.createdAt && <> • {formatDate(data.createdAt)}</>}
              </p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link href={`/teacher/exams/${params.id}/results`}>
              <BarChart3 className="h-4 w-4" /> Natijalar
            </Link>
          </Button>
        </div>
      </div>

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
            <p className="text-muted-foreground">Savollar topilmadi</p>
          </CardContent>
        </Card>
      )}

      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Variantlar bo'yicha savollar</CardTitle>
            <CardDescription>To'g'ri javoblar yashil rangda ko'rsatilgan</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={String(first)}>
              <TabsList className="flex-wrap h-auto">
                {variants.map((v) => (
                  <TabsTrigger key={v.variantNumber} value={String(v.variantNumber)}>
                    Variant {v.variantNumber}
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
