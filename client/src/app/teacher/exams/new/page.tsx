"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, ArrowLeft, FileCheck2, CheckCircle2, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { previewExamFile, createExam } from "@/api/exams";
import { extractError } from "@/lib/api";
import type { ExamPreview } from "@/types";
import { cn } from "@/lib/utils";

type Step = "upload" | "review";

export default function NewExamPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [variantCount, setVariantCount] = useState<2 | 4 | 6>(2);
  const [preview, setPreview] = useState<ExamPreview | null>(null);
  const [title, setTitle] = useState("");

  const previewMutation = useMutation({
    mutationFn: (payload: { file: File; variantCount: number }) => previewExamFile(payload),
    onSuccess: (data) => {
      setPreview(data);
      setTitle(data.suggestedTitle);
      setStep("review");
    },
    onError: (e) => toast({ variant: "destructive", title: "Tahlil xatoligi", description: extractError(e) }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createExam({
        title,
        variantCount: preview!.variantCount,
        originalFilename: preview!.originalFilename,
        variants: preview!.variants,
      }),
    onSuccess: (exam) => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast({ title: "Imtihon yaratildi", description: exam.title });
      router.push("/teacher/exams");
    },
    onError: (e) => toast({ variant: "destructive", title: "Saqlash xatoligi", description: extractError(e) }),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/teacher/exams"><ArrowLeft className="h-4 w-4" /> Imtihonlar</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Yangi imtihon yaratish</h1>
        <p className="text-muted-foreground">
          Fayl yuklang → variantlarni ko'rib chiqing → tasdiqlang
        </p>
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
          onBack={() => setStep("upload")}
          onConfirm={() => createMutation.mutate()}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Fayl yuklash" },
    { key: "review", label: "Ko'rib chiqish" },
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fayl va variantlar soni</CardTitle>
        <CardDescription>
          .docx yoki matnli .pdf fayl yuklang. To'g'ri javob Word'da <b>bold/underline</b> bilan,
          PDF'da <b>bold</b> bilan yoki <code>+</code> belgisi orqali belgilanadi (masalan: <code>+B) javob</code>).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="file">Fayl</Label>
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
                <p className="text-sm font-medium">Faylni bu yerga torting yoki tanlang</p>
                <p className="text-xs text-muted-foreground">.docx yoki matnli .pdf</p>
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
          <Label>Variantlar soni</Label>
          <Select value={String(variantCount)} onValueChange={(v) => onVariantCountChange(Number(v) as 2 | 4 | 6)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2, 4, 6].map((n) => <SelectItem key={n} value={String(n)}>{n} ta variant</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onNext} disabled={!file || loading} className="w-full">
          {loading ? "Tahlil qilinmoqda..." : "Tahlil qilish va ko'rib chiqish"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ReviewStep({
  preview, onPreviewChange, title, onTitleChange, onBack, onConfirm, loading,
}: {
  preview: ExamPreview;
  onPreviewChange: (p: ExamPreview) => void;
  title: string;
  onTitleChange: (v: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
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
        <AlertTitle>Fayl muvaffaqiyatli tahlil qilindi</AlertTitle>
        <AlertDescription>
          Hozirgi: <b>{totalQuestions}</b> savol
          {preview.discardedQuestions > 0 && <> • Tashlab yuborilgan: {preview.discardedQuestions}</>}
        </AlertDescription>
      </Alert>

      {missingAnswer > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>To'g'ri javob belgilanmagan: {missingAnswer} ta savol</AlertTitle>
          <AlertDescription>
            Saqlash uchun har bir savolda variant ustiga bosib to'g'ri javobni belgilang yoki savolni o'chiring.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Imtihon nomi
          </CardTitle>
          <CardDescription>Fayl nomidan avtomatik to'ldirildi — xohlasangiz tahrirlang</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Imtihon nomi" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variantlar bo'yicha taqsimlangan savollar</CardTitle>
          <CardDescription>
            Variant ustiga bosib to'g'ri javobni belgilang. Kerakli savollarni o'chirib tashlashingiz mumkin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={String(first)}>
            <TabsList className="flex-wrap h-auto">
              {preview.variants.map((v) => (
                <TabsTrigger key={v.variantNumber} value={String(v.variantNumber)}>
                  Variant {v.variantNumber}
                  <Badge variant="secondary" className="ml-2">{v.questions.length}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {preview.variants.map((v) => (
              <TabsContent key={v.variantNumber} value={String(v.variantNumber)} className="space-y-4">
                {v.questions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Bu variantda savol qolmadi</p>
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
          <ArrowLeft className="h-4 w-4" /> Orqaga
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading || !title.trim() || totalQuestions === 0 || missingAnswer > 0}
        >
          {loading ? "Saqlanmoqda..." : "Tasdiqlash va saqlash"}
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
          title="Savolni o'chirish"
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
              title={correct ? "To'g'ri javob" : "To'g'ri javob deb belgilash"}
            >
              <span className="font-semibold uppercase">{o.key})</span>
              <span className="flex-1 whitespace-pre-wrap">{o.text}</span>
              {correct && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
            </button>
          );
        })}
      </div>
      {noAnswer && (
        <p className="mt-2 pl-8 text-xs text-destructive">
          To'g'ri javob belgilanmagan — variant ustiga bosing
        </p>
      )}
    </div>
  );
}
