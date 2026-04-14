"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Lock, Clock, CalendarClock, Trophy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getVariants } from "@/api/exams";
import { startExam } from "@/api/sessions";
import { extractError } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function VariantsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["variants", params.id],
    queryFn: () => getVariants(params.id),
    refetchInterval: 30_000, // har 30 soniyada holat yangilanadi (startsAt, frozen)
  });

  const startMutation = useMutation({
    mutationFn: (variantNumber: number) => startExam(params.id, variantNumber),
    onSuccess: (res) => {
      sessionStorage.setItem(
        `session:${res.sessionId}`,
        JSON.stringify({
          questions: res.questions,
          answers: res.answers || [],
          endsAt: res.endsAt || null,
        })
      );
      router.push(`/student/exams/${params.id}/take/${res.sessionId}`);
    },
    onError: (e) => toast({ variant: "destructive", title: "Boshlash mumkin emas", description: extractError(e) }),
  });

  const isFrozen = data?.exam.isFrozen;
  const startsAt = data?.exam.startsAt ? new Date(data.exam.startsAt) : null;
  const notStartedYet = startsAt ? new Date() < startsAt : false;
  const durationMinutes = data?.exam.durationMinutes;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/student/exams"><ArrowLeft className="h-4 w-4" /> Imtihonlar</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{data?.exam.title || "Yuklanmoqda..."}</h1>
        <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
          {durationMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {durationMinutes} daqiqa
            </span>
          )}
          {startsAt && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" /> {formatDate(startsAt)}
            </span>
          )}
        </div>
      </div>

      {isFrozen && (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Imtihon muzlatilgan</AlertTitle>
          <AlertDescription>Hozircha bu imtihonga kirish mumkin emas. Keyinroq urinib ko'ring.</AlertDescription>
        </Alert>
      )}

      {!isFrozen && notStartedYet && startsAt && (
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>Imtihon hali boshlanmagan</AlertTitle>
          <AlertDescription>
            Boshlanish vaqti: <b>{formatDate(startsAt)}</b>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.variants.map((v) => {
            const completed = !!v.completedSessionId;
            const disabled = isFrozen || notStartedYet || startMutation.isPending;
            return (
              <Card key={v.variantNumber} className={completed ? "border-emerald-500/50 bg-emerald-50/30" : undefined}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>Variant {v.variantNumber}</CardTitle>
                    {completed && <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Topshirilgan</Badge>}
                    {!completed && v.hasActiveSession && <Badge variant="warning">Davom etmoqda</Badge>}
                  </div>
                  <CardDescription>{v.questionCount} ta savol</CardDescription>
                </CardHeader>
                <CardContent>
                  {completed ? (
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/student/sessions/${v.completedSessionId}/result`}>
                        <Trophy className="h-4 w-4" /> Natijamni ko'rish
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={disabled}
                      onClick={() => startMutation.mutate(v.variantNumber)}
                    >
                      <Play className="h-4 w-4" />
                      {v.hasActiveSession ? "Davom ettirish" : "Boshlash"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
