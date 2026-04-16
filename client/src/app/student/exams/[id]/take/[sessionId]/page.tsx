"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/context";
import { submitAnswer, finishExam } from "@/api/sessions";
import { extractError } from "@/lib/api";
import type { FinishResult } from "@/types";
import { cn } from "@/lib/utils";

type Q = {
  id: string;
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type Choice = "a" | "b" | "c" | "d";

export default function TakeExamPage({ params }: { params: { id: string; sessionId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLang();
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const raw = sessionStorage.getItem(`session:${params.sessionId}`);
    if (!raw) {
      toast({
        variant: "destructive",
        title: t.takeExam.sessionNotFound,
        description: t.takeExam.sessionNotFoundDescription,
      });
      router.replace(`/student/exams/${params.id}`);
      return;
    }
    const parsed = JSON.parse(raw) as {
      questions: Q[];
      answers?: Array<{ questionId: string; selectedAnswer: Choice }>;
      endsAt?: string | null;
    };
    setQuestions(parsed.questions);
    if (parsed.answers?.length) {
      const map: Record<string, Choice> = {};
      for (const a of parsed.answers) map[a.questionId] = a.selectedAnswer;
      setAnswers(map);
    }
    if (parsed.endsAt) setEndsAt(new Date(parsed.endsAt));
  }, [params.sessionId, params.id, router, toast, t]);

  useEffect(() => {
    if (!endsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const submitMut = useMutation({
    mutationFn: ({ questionId, choice }: { questionId: string; choice: Choice }) =>
      submitAnswer(params.sessionId, questionId, choice),
    onError: (e) => toast({ variant: "destructive", title: t.takeExam.saveFailed, description: extractError(e) }),
  });

  const finishMut = useMutation({
    mutationFn: () => finishExam(params.sessionId),
    onSuccess: (r) => {
      sessionStorage.removeItem(`session:${params.sessionId}`);
      setResult(r);
      setConfirmFinish(false);
    },
    onError: (e) => toast({ variant: "destructive", title: t.takeExam.finishError, description: extractError(e) }),
  });

  const total = questions?.length ?? 0;
  const current = questions?.[index];
  const answeredCount = Object.keys(answers).length;
  const progress = total ? Math.round((answeredCount / total) * 100) : 0;

  const remainingMs = endsAt ? endsAt.getTime() - now : null;
  const expired = remainingMs !== null && remainingMs <= 0;

  useEffect(() => {
    if (expired && !result && questions) {
      finishMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  const options = useMemo(() => {
    if (!current) return [];
    return [
      { key: "a" as const, text: current.optionA },
      { key: "b" as const, text: current.optionB },
      { key: "c" as const, text: current.optionC },
      { key: "d" as const, text: current.optionD },
    ];
  }, [current]);

  if (!questions) {
    return <div className="container py-10 text-center text-muted-foreground">{t.loading}</div>;
  }

  if (result) return <ResultView result={result} examId={params.id} />;

  const onChoose = (choice: Choice) => {
    if (!current) return;
    if (answers[current.id]) return;
    setAnswers((a) => ({ ...a, [current.id]: choice }));
    submitMut.mutate({ questionId: current.id, choice });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {t.takeExam.questionOf(index + 1, total)}
          </p>
          <p className="text-xs text-muted-foreground">{t.takeExam.answered(answeredCount)}</p>
        </div>
        <div className="flex items-center gap-2">
          {remainingMs !== null && <CountdownBadge remainingMs={Math.max(remainingMs, 0)} />}
          <Badge variant="secondary">{t.takeExam.percentDone(progress)}</Badge>
        </div>
      </div>
      <Progress value={progress} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-snug whitespace-pre-wrap">
            {current?.questionText}
          </CardTitle>
          <CardDescription>{t.takeExam.selectOne}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            key={current?.id}
            value={current ? answers[current.id] ?? "" : ""}
            onValueChange={(v) => onChoose(v as Choice)}
          >
            {options.map((o) => {
              const selected = current && answers[current.id] === o.key;
              const locked = current ? !!answers[current.id] : false;
              return (
                <Label
                  key={o.key}
                  htmlFor={`opt-${o.key}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors",
                    selected ? "border-primary bg-primary/5" : "hover:bg-accent",
                    locked && !selected && "opacity-60"
                  )}
                >
                  <RadioGroupItem id={`opt-${o.key}`} value={o.key} disabled={locked} className="mt-0.5" />
                  <div className="flex-1">
                    <span className="mr-2 font-semibold uppercase">{o.key})</span>
                    <span className="whitespace-pre-wrap">{o.text}</span>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          <ArrowLeft className="h-4 w-4" /> {t.takeExam.previous}
        </Button>
        <NumberPad questions={questions} answers={answers} index={index} onSelect={setIndex} />
        {index < total - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)}>{t.takeExam.next} <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button onClick={() => setConfirmFinish(true)} variant="default">
            <CheckCircle2 className="h-4 w-4" /> {t.takeExam.finish}
          </Button>
        )}
      </div>

      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.takeExam.finishTitle}</DialogTitle>
            <DialogDescription>
              {t.takeExam.finishDescription(answeredCount, total)}
              {answeredCount < total && t.takeExam.unansweredWarning}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFinish(false)}>{t.cancel}</Button>
            <Button onClick={() => finishMut.mutate()} disabled={finishMut.isPending}>
              {finishMut.isPending ? t.takeExam.finishing : t.takeExam.yesFinish}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CountdownBadge({ remainingMs }: { remainingMs: number }) {
  const totalSec = Math.floor(remainingMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const label =
    h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  const urgent = remainingMs <= 60_000;
  return (
    <Badge variant={urgent ? "destructive" : "default"} className="font-mono">
      <Clock className="h-3 w-3" /> {label}
    </Badge>
  );
}

function NumberPad({
  questions, answers, index, onSelect,
}: { questions: Q[]; answers: Record<string, "a" | "b" | "c" | "d">; index: number; onSelect: (i: number) => void }) {
  return (
    <div className="hidden flex-wrap gap-1 md:flex">
      {questions.map((q, i) => {
        const answered = !!answers[q.id];
        const active = i === index;
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "h-7 w-7 rounded text-xs font-medium transition-colors",
              active && "ring-2 ring-primary ring-offset-1",
              answered ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

function ResultView({ result, examId }: { result: FinishResult; examId: string }) {
  const { t } = useLang();
  const variant: "success" | "default" | "destructive" =
    result.percentage >= 70 ? "success" : result.percentage >= 50 ? "default" : "destructive";
  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      <Alert variant={variant === "destructive" ? "destructive" : "success"}>
        <Trophy className="h-4 w-4" />
        <AlertTitle>{t.result.examFinished}</AlertTitle>
        <AlertDescription>{t.result.yourResult}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-5xl font-bold">{result.percentage}%</CardTitle>
          <CardDescription>{t.result.overallResult}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label={t.result.totalQuestions} value={result.totalQuestions} />
          <Row label={t.result.correctAnswers} value={result.correct} />
          <Row label={t.result.incorrectAnswers} value={result.incorrect} />
          <Progress value={result.percentage} className="mt-4" />
        </CardContent>
      </Card>

      <div className="flex justify-center gap-2">
        <Button asChild variant="outline">
          <Link href={`/student/exams/${examId}`}>{t.result.backToVariants}</Link>
        </Button>
        <Button asChild>
          <Link href="/student/exams">{t.result.examsList}</Link>
        </Button>
      </div>
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
