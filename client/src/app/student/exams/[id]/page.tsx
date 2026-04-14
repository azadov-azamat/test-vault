"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getVariants } from "@/api/exams";
import { startExam } from "@/api/sessions";
import { extractError } from "@/lib/api";

export default function VariantsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["variants", params.id],
    queryFn: () => getVariants(params.id),
  });

  const startMutation = useMutation({
    mutationFn: (variantNumber: number) => startExam(params.id, variantNumber),
    onSuccess: (res) => {
      sessionStorage.setItem(`session:${res.sessionId}`, JSON.stringify(res.questions));
      router.push(`/student/exams/${params.id}/take/${res.sessionId}`);
    },
    onError: (e) => toast({ variant: "destructive", title: "Boshlash mumkin emas", description: extractError(e) }),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/student/exams"><ArrowLeft className="h-4 w-4" /> Imtihonlar</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{data?.exam.title || "Yuklanmoqda..."}</h1>
        <p className="text-muted-foreground">Variantlardan birini tanlang va testni boshlang</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.variants.map((v) => (
            <Card key={v.variantNumber}>
              <CardHeader>
                <CardTitle>Variant {v.variantNumber}</CardTitle>
                <CardDescription>{v.questionCount} ta savol</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  disabled={startMutation.isPending}
                  onClick={() => startMutation.mutate(v.variantNumber)}
                >
                  <Play className="h-4 w-4" /> Boshlash
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
