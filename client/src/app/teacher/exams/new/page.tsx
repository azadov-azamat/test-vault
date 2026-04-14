"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, ArrowLeft, FileCheck2, CheckCircle2, Pencil, Trash2, AlertTriangle, Clock, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/context";
import { previewExamFile, createExam } from "@/api/exams";
import { extractError } from "@/lib/api";
import type { ExamPreview } from "@/types";
import { cn } from "@/lib/utils";

type Step = "upload" | "review";

export default function NewExamPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useLang();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [variantCount, setVariantCount] = useState<2 | 4 | 6>(2);
  const [preview, setPreview] = useState<ExamPreview | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState<string>("");
  const [minutesPerQuestion, setMinutesPerQuestion] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);

  const previewMutation = useMutation({
    mutationFn: (payload: { file: File; variantCount: number }) => previewExamFile(payload),
    onSuccess: (data) => {
      setPreview(data);
      setTitle(data.suggestedTitle);
      setDurationMinutes(data.questionsPerVariant * minutesPerQuestion);
      setStep("review");
    },
    onError: (e) => toast({ variant: "destructive", title: t.newExam.analyzeError, description: extractError(e) }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createExam({
        title,
        variantCount: preview!.variantCount,
        originalFilename: preview!.originalFilename,
        variants: preview!.variants,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        durationMinutes: durationMinutes ?? null,
        minutesPerQuestion: minutesPerQuestion || null,
      }),
    onSuccess: (exam) => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast({ title: t.newExam.examCreated, description: exam.title });
      router.push("/teacher/exams");
    },
    onError: (e) => toast({ variant: "destructive", title: t.newExam.saveError, description: extractError(e) }),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/teacher/exams"><ArrowLeft className="h-4 w-4" /> {t.exams}</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{t.newExam.title}</h1>
        <p className="text-muted-foreground">{t.newExam.description}</p>
      </div>

      <Stepper step={step} />

      {step === "upload" && (
        <UploadStep
          file={file}
          onFileChange={setFile}
          variantCount={variantCount}
          onVariantCountChange={setVariantCount}
          loading={previewMutation.isPending}
          onNext={() => file && previewMutation.mutate({ file, variantCount })}
        />
      )}

      {step === "review" && preview && (
        <ReviewStep
          preview={preview}
          onPreviewChange={setPreview}
          title={title}
          onTitleChange={setTitle}
          startsAt={startsAt}
          onStartsAtChange={setStartsAt}
          minutesPerQuestion={minutesPerQuestion}
          onMinutesPerQuestionChange={(n) => {
            setMinutesPerQuestion(n);
            setDurationMinutes(preview.questionsPerVariant * n);
          }}
          durationMinutes={durationMinutes}
          onDurationMinutesChange={setDurationMinutes}
          onBack={() => setStep("upload")}
          onConfirm={() => createMutation.mutate()}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const { t } = useLang();
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: t.newExam.stepUpload },
    { key: "review", label: t.newExam.stepReview },
  ];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => {
        const active = s.key === step;
        const done = step === "review" && s.key === "upload";
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                active && "bg-primary text-primary-foreground",
                done && "bg-emerald-500 text-white",
                !active && !done && "bg-muted text-muted-foreground"
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("text-sm", active ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
            {i < steps.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function UploadStep({
  file, onFileChange, variantCount, onVariantCountChange, loading, onNext,
}: {
  file: File | null;
  onFileChange: (f: File | null) => void;
  variantCount: 2 | 4 | 6;
  onVariantCountChange: (n: 2 | 4 | 6) => void;
  loading: boolean;
  onNext: () => void;
}) {
  const { t } = useLang();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.newExam.uploadTitle}</CardTitle>
        <CardDescription>{t.newExam.uploadDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="file">{t.newExam.fileLabel}</Label>
          <label
            htmlFor="file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input p-6 transition-colors hover:bg-accent"
          >
            <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
            {file ? (
              <>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">{t.newExam.dragOrSelect}</p>
                <p className="text-xs text-muted-foreground">{t.newExam.fileTypes}</p>
              </>
            )}
            <input
              id="file"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="space-y-1.5">
          <Label>{t.newExam.variantCountLabel}</Label>
          <Select value={String(variantCount)} onValueChange={(v) => onVariantCountChange(Number(v) as 2 | 4 | 6)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2, 4, 6].map((n) => <SelectItem key={n} value={String(n)}>{t.newExam.nVariants(n)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onNext} disabled={!file || loading} className="w-full">
          {loading ? t.newExam.analyzing : t.newExam.analyzeButton}
        </Button>
      </CardContent>
    </Card>
  );
}

function ReviewStep({
  preview, onPreviewChange, title, onTitleChange,
  startsAt, onStartsAtChange,
  minutesPerQuestion, onMinutesPerQuestionChange,
  durationMinutes, onDurationMinutesChange,
  onBack, onConfirm, loading,
}: {
  preview: ExamPreview;
  onPreviewChange: (p: ExamPreview) => void;
  title: string;
  onTitleChange: (v: string) => void;
  startsAt: string;
  onStartsAtChange: (v: string) => void;
  minutesPerQuestion: number;
  onMinutesPerQuestionChange: (n: number) => void;
  durationMinutes: number | null;
  onDurationMinutesChange: (n: number | null) => void;
  onBack: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const { t } = useLang();
  const first = preview.variants[0]?.variantNumber ?? 1;
  const totalQuestions = preview.variants.reduce((s, v) => s + v.questions.length, 0);
  const missingAnswer = preview.variants.flatMap((v) =>
    v.questions.filter((q) => !q.correctAnswer)
  ).length;

  const setCorrect = (variantNumber: number, questionOrder: number, letter: "a" | "b" | "c" | "d") => {
    onPreviewChange({
      ...preview,
      variants: preview.variants.map((v) =>
        v.variantNumber !== variantNumber
          ? v
          : {
              ...v,
              questions: v.questions.map((q) =>
                q.questionOrder === questionOrder ? { ...q, correctAnswer: letter } : q
              ),
            }
      ),
    });
  };

  const deleteQuestion = (variantNumber: number, questionOrder: number) => {
    onPreviewChange({
      ...preview,
      variants: preview.variants.map((v) =>
        v.variantNumber !== variantNumber
          ? v
          : {
              ...v,
              questions: v.questions
                .filter((q) => q.questionOrder !== questionOrder)
                .map((q, i) => ({ ...q, questionOrder: i + 1 })),
            }
      ),
    });
  };

  return (
    <div className="space-y-6">
      <Alert variant="success">
        <FileCheck2 className="h-4 w-4" />
        <AlertTitle>{t.newExam.fileSuccess}</AlertTitle>
        <AlertDescription>
          {t.newExam.currentQuestions(totalQuestions)}
          {preview.discardedQuestions > 0 && <> • {t.newExam.discarded(preview.discardedQuestions)}</>}
        </AlertDescription>
      </Alert>

      {missingAnswer > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t.newExam.missingAnswerTitle(missingAnswer)}</AlertTitle>
          <AlertDescription>{t.newExam.missingAnswerDescription}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Pencil className="h-4 w-4" /> {t.newExam.examNameTitle}
          </CardTitle>
          <CardDescription>{t.newExam.examNameDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder={t.newExam.examNamePlaceholder} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4" /> {t.newExam.timeTitle}
          </CardTitle>
          <CardDescription>{t.newExam.timeDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t.newExam.perQuestion}</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={minutesPerQuestion}
                onChange={(e) => onMinutesPerQuestionChange(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                {t.newExam.perQuestionHint(preview.questionsPerVariant, minutesPerQuestion)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{t.newExam.totalTime}</Label>
              <Input
                type="number"
                min={0}
                value={durationMinutes ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onDurationMinutesChange(v === "" ? null : Number(v));
                }}
                placeholder={t.newExam.noTimeLimit}
              />
              <p className="text-xs text-muted-foreground">{t.newExam.totalTimeHint}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" /> {t.newExam.startTime}
              </Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => onStartsAtChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t.newExam.startTimeHint}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.newExam.questionsTitle}</CardTitle>
          <CardDescription>{t.newExam.questionsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={String(first)}>
            <TabsList className="flex-wrap h-auto">
              {preview.variants.map((v) => (
                <TabsTrigger key={v.variantNumber} value={String(v.variantNumber)}>
                  {t.variant} {v.variantNumber}
                  <Badge variant="secondary" className="ml-2">{v.questions.length}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {preview.variants.map((v) => (
              <TabsContent key={v.variantNumber} value={String(v.variantNumber)} className="space-y-4">
                {v.questions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t.newExam.noQuestionsInVariant}</p>
                ) : (
                  v.questions.map((q) => (
                    <QuestionCard
                      key={q.questionOrder}
                      num={q.questionOrder}
                      q={q}
                      onSetCorrect={(letter) => setCorrect(v.variantNumber, q.questionOrder, letter)}
                      onDelete={() => deleteQuestion(v.variantNumber, q.questionOrder)}
                    />
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading || !title.trim() || totalQuestions === 0 || missingAnswer > 0}
        >
          {loading ? t.saving : t.newExam.confirm}
        </Button>
      </div>
    </div>
  );
}

function QuestionCard({
  num, q, onSetCorrect, onDelete,
}: {
  num: number;
  q: { questionText: string; optionA: string; optionB: string; optionC: string | null; optionD: string | null; correctAnswer: string };
  onSetCorrect: (letter: "a" | "b" | "c" | "d") => void;
  onDelete: () => void;
}) {
  const { t } = useLang();
  const options: Array<{ key: "a" | "b" | "c" | "d"; text: string | null }> = [
    { key: "a", text: q.optionA },
    { key: "b", text: q.optionB },
    { key: "c", text: q.optionC },
    { key: "d", text: q.optionD },
  ];
  const noAnswer = !q.correctAnswer;
  return (
    <div className={cn("rounded-md border p-4", noAnswer && "border-destructive/50 bg-destructive/5")}>
      <div className="mb-2 flex items-start gap-2">
        <Badge variant="outline" className="shrink-0">{num}</Badge>
        <p className="flex-1 whitespace-pre-wrap text-sm font-medium">{q.questionText}</p>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          title={t.newExam.deleteQuestion}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 grid gap-1.5 pl-8 text-sm sm:grid-cols-2">
        {options.filter((o) => o.text).map((o) => {
          const correct = !!q.correctAnswer && o.key === q.correctAnswer.toLowerCase();
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onSetCorrect(o.key)}
              className={cn(
                "flex items-start gap-2 rounded px-2 py-1.5 text-left transition-colors",
                correct
                  ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/40"
                  : "hover:bg-accent"
              )}
              title={correct ? t.newExam.correctAnswer : t.newExam.markCorrect}
            >
              <span className="font-semibold uppercase">{o.key})</span>
              <span className="flex-1 whitespace-pre-wrap">{o.text}</span>
              {correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
            </button>
          );
        })}
      </div>
      {noAnswer && (
        <p className="mt-2 pl-8 text-xs text-destructive">{t.newExam.missingAnswerHint}</p>
      )}
    </div>
  );
}
