"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getStudentExams } from "@/api/exams";
import { formatDate } from "@/lib/utils";

export default function StudentExamsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["student-exams"], queryFn: getStudentExams });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mavjud imtihonlar</h1>
        <p className="text-muted-foreground">Test topshirish uchun imtihonni tanlang</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : data?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Hozircha imtihon mavjud emas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((e) => (
            <Link key={e.id} href={`/student/exams/${e.id}`}>
              <Card className="h-full transition-all hover:border-primary hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{e.title}</CardTitle>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>{formatDate(e.createdAt)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{e.variantCount} variant</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
