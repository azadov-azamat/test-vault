"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText, BarChart3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getExams } from "@/api/exams";
import { useLang } from "@/i18n/context";
import { formatDate } from "@/lib/utils";

export default function ExamsListPage() {
  const router = useRouter();
  const { t } = useLang();
  const { data, isLoading } = useQuery({ queryKey: ["exams"], queryFn: getExams });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.examsList.title}</h1>
          <p className="text-muted-foreground">{t.examsList.description}</p>
        </div>
        <Button asChild>
          <Link href="/teacher/exams/new"><Plus className="h-4 w-4" /> {t.examsList.newExam}</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : data?.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.examsList.name}</TableHead>
                  <TableHead>{t.examsList.variantsCol}</TableHead>
                  <TableHead>{t.examsList.file}</TableHead>
                  <TableHead>{t.examsList.created}</TableHead>
                  <TableHead className="text-right">{t.examsList.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/teacher/exams/${e.id}`)}
                  >
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell><Badge variant="secondary">{e.variantCount}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {e.originalFilename || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(e.createdAt)}</TableCell>
                    <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="inline-flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/teacher/exams/${e.id}`}>
                            <Eye className="h-4 w-4" /> {t.variants}
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/teacher/exams/${e.id}/results`}>
                            <BarChart3 className="h-4 w-4" /> {t.results}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{t.examsList.noExams}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t.examsList.noExamsHint}</p>
      <Button asChild className="mt-4">
        <Link href="/teacher/exams/new"><Plus className="h-4 w-4" /> {t.examsList.newExam}</Link>
      </Button>
    </div>
  );
}
