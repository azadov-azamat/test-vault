"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [result, setResult] = useState<FinishResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`session:${params.sessionId}`);
    if (!raw) {
      toast({
        variant: "destructive",
        title: "Sessiya topilmadi",
        description: "Iltimos, imtihonni qaytadan boshlang",
      });
      router.replace(`/student/exams/${params.id}`);
      return;
    }
    setQuestions(JSON.parse(raw) as Q[]);
  }, [params.sessionId, params.id, router, toast]);

  const submitMut = useMutation({
    mutationFn: ({ questionId, choice }: { questionId: string; choice: Choice }) =>
      submitAnswer(params.sessionId, questionId, choice),
    onError: (e) => toast({ variant: "destructive", title: "Saqlanmadi", description: extractError(e) }),
  });

  const finishMut = useMutation({
    mutationFn: () => finishExam(params.sessionId),
    onSuccess: (r) => {
      sessionStorage.removeItem(`session:${params.sessionId}`);
      setResult(r);
      setConfirmFinish(false);
    },
    onError: (e) => toast({ variant: "destructive", title: "Yakunlash xatoligi", description: extractError(e) }),
  });

  const total = questions?.length ?? 0;
  const current = questions?.[index];
  const answeredCount = Object.keys(answers).length;
  const progress = total ? Math.round((answeredCount / total) * 100) : 0;

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
    return <div className="container py-10 text-center text-muted-foreground">Yuklanmoqda...</div>;
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
            Savol {index + 1} / {total}
          </p>
          <p className="text-xs text-muted-foreground">Javob berildi: {answeredCount}</p>
        </div>
        <Badge variant="secondary">{progress}% tugadi</Badge>
      </div>
      <Progress value={progress} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-snug whitespace-pre-wrap">
            {current?.questionText}
          </CardTitle>
          <CardDescription>Bitta to'g'ri javobni tanlang</CardDescription>
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
          <ArrowLeft className="h-4 w-4" /> Oldingi
        </Button>
        <NumberPad questions={questions} answers={answers} index={index} onSelect={setIndex} />
        {index < total - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)}>Keyingi <ArrowRight className="h-4 w-4" /></Button>
        ) : (
          <Button onClick={() => setConfirmFinish(true)} variant="default">
            <CheckCircle2 className="h-4 w-4" /> Yakunlash
          </Button>
        )}
      </div>

      <Dialog open={confirmFinish} onOpenChange={setConfirmFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Imtihonni yakunlaysizmi?</DialogTitle>
            <DialogDescription>
              Siz {answeredCount} ta savolga javob berdingiz ({total} dan).
              {answeredCount < total && " Javobsiz savollar noto'g'ri sifatida hisoblanadi."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFinish(false)}>Bekor qilish</Button>
            <Button onClick={() => finishMut.mutate()} disabled={finishMut.isPending}>
              {finishMut.isPending ? "Yakunlanmoqda..." : "Ha, yakunlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
  const variant: "success" | "default" | "destructive" =
    result.percentage >= 70 ? "success" : result.percentage >= 50 ? "default" : "destructive";
  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      <Alert variant={variant === "destructive" ? "destructive" : "success"}>
        <Trophy className="h-4 w-4" />
        <AlertTitle>Imtihon yakunlandi</AlertTitle>
        <AlertDescription>Sizning natijangiz tayyor</AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-5xl font-bold">{result.percentage}%</CardTitle>
          <CardDescription>Umumiy natija</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Jami savollar" value={result.totalQuestions} />
          <Row label="To'g'ri javoblar" value={result.correct} />
          <Row label="Noto'g'ri javoblar" value={result.incorrect} />
          <Progress value={result.percentage} className="mt-4" />
        </CardContent>
      </Card>

      <div className="flex justify-center gap-2">
        <Button asChild variant="outline">
          <Link href={`/student/exams/${examId}`}>Variantlarga qaytish</Link>
        </Button>
        <Button asChild>
          <Link href="/student/exams">Imtihonlar ro'yxati</Link>
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
