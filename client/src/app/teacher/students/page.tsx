"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Copy, Check, Eye, EyeOff, Pencil, Trash2, BarChart3, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/context";
import { getStudents, createStudent, updateStudent, deleteStudent } from "@/api/students";
import { extractError } from "@/lib/api";
import { createStudentSchemaI18n, type CreateStudentValues } from "@/schemas/teacher";
import type { CreatedStudent, Student } from "@/types";
import { formatDate } from "@/lib/utils";

export default function StudentsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useLang();
  const { data, isLoading } = useQuery({ queryKey: ["students"], queryFn: getStudents });
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<CreatedStudent | null>(null);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);

  const createM = useMutation({
    mutationFn: (v: CreateStudentValues) => createStudent(v.fullName),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      setCreated(s);
      toast({ title: t.students.studentAdded, description: s.fullName });
    },
    onError: (e) => toast({ variant: "destructive", title: t.error, description: extractError(e) }),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast({ title: t.students.studentDeleted });
      setDeleting(null);
    },
    onError: (e) => toast({ variant: "destructive", title: t.students.deleteError, description: extractError(e) }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.students.title}</h1>
          <p className="text-muted-foreground">{t.students.description}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) setCreated(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> {t.students.newStudent}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.students.addTitle}</DialogTitle>
              <DialogDescription>{t.students.addDescription}</DialogDescription>
            </DialogHeader>
            {created ? (
              <CredentialsView student={created} onClose={() => { setCreated(null); setCreateOpen(false); }} />
            ) : (
              <Formik<CreateStudentValues>
                initialValues={{ fullName: "" }}
                validationSchema={createStudentSchemaI18n(t)}
                onSubmit={(v) => createM.mutate(v)}
              >
                <Form className="space-y-4">
                  <FormField name="fullName" label={t.students.fullNameLabel} placeholder={t.students.fullNamePlaceholder} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>{t.cancel}</Button>
                    <Button type="submit" disabled={createM.isPending}>
                      {createM.isPending ? t.saving : t.create}
                    </Button>
                  </DialogFooter>
                </Form>
              </Formik>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">{t.students.noStudents}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.students.noStudentsHint}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.students.fio}</TableHead>
                  <TableHead>{t.students.loginCol}</TableHead>
                  <TableHead>{t.students.passwordCol}</TableHead>
                  <TableHead>{t.students.addedCol}</TableHead>
                  <TableHead className="text-right">{t.students.actionsCol}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    onEdit={() => setEditing(s)}
                    onDelete={() => setDeleting(s)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EditDialog student={editing} onClose={() => setEditing(null)} />
      <DeleteDialog
        student={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteM.mutate(deleting.id)}
        loading={deleteM.isPending}
      />
    </div>
  );
}

function StudentRow({
  student, onEdit, onDelete,
}: {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const password = student.password;

  const goDetails = () => router.push(`/teacher/students/${student.id}`);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!password) return;
    await navigator.clipboard.writeText(`Login: ${student.login}\nParol: ${password}`);
    toast({ title: t.students.loginPasswordCopied });
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <TableRow className="cursor-pointer" onClick={goDetails}>
      <TableCell className="font-medium">{student.fullName}</TableCell>
      <TableCell><code className="rounded bg-muted px-2 py-0.5 text-sm">{student.login}</code></TableCell>
      <TableCell onClick={stop}>
        {password ? (
          <div className="inline-flex items-center gap-1">
            <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">
              {visible ? password : "•".repeat(Math.max(password.length, 6))}
            </code>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setVisible((v) => !v)} title={visible ? t.hide : t.show}>
              {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={copy} title={t.copy}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(student.createdAt)}</TableCell>
      <TableCell className="text-right" onClick={stop}>
        <div className="inline-flex gap-1">
          <Button size="sm" variant="outline" onClick={goDetails} title={t.students.viewResults}>
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit} title={t.students.edit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
            title={t.delete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function EditDialog({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useLang();
  const [fullName, setFullName] = useState("");
  const [regenerate, setRegenerate] = useState(false);

  const open = !!student;

  const m = useMutation({
    mutationFn: () =>
      updateStudent(student!.id, {
        fullName: fullName.trim() || undefined,
        regeneratePassword: regenerate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast({ title: t.students.studentUpdated });
      onClose();
    },
    onError: (e) => toast({ variant: "destructive", title: t.error, description: extractError(e) }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
        else if (student) {
          setFullName(student.fullName);
          setRegenerate(false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.students.editTitle}</DialogTitle>
          <DialogDescription>{t.students.editDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.students.fullNameLabel}</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t.students.fullNamePlaceholder}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm hover:bg-accent">
            <input
              type="checkbox"
              checked={regenerate}
              onChange={(e) => setRegenerate(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1 font-medium">
                <RefreshCcw className="h-3.5 w-3.5" /> {t.students.regeneratePassword}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.students.regenerateHint}</p>
            </div>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !fullName.trim()}>
            {m.isPending ? t.saving : t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  student, onCancel, onConfirm, loading,
}: {
  student: Student | null;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const { t } = useLang();
  return (
    <Dialog open={!!student} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.students.deleteTitle}</DialogTitle>
          <DialogDescription>
            {student && t.students.deleteDescription(student.fullName)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{t.cancel}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? t.deleting : t.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredentialsView({ student, onClose }: { student: CreatedStudent; onClose: () => void }) {
  const { toast } = useToast();
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const text = `Login: ${student.login}\nParol: ${student.password}`;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: t.copied });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <Alert variant="success">
        <Check className="h-4 w-4" />
        <AlertTitle>{t.students.createdTitle(student.fullName)}</AlertTitle>
        <AlertDescription>{t.students.createdDescription}</AlertDescription>
      </Alert>
      <div className="space-y-2 rounded-md border bg-muted/30 p-4">
        <Row label="Login" value={student.login} />
        <Row label={t.students.passwordCol} value={student.password} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {t.copy}
        </Button>
        <Button onClick={onClose}>{t.close}</Button>
      </DialogFooter>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <code className="rounded bg-background px-2 py-0.5 font-mono">{value}</code>
    </div>
  );
}
