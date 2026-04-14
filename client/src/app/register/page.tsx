"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import { useMutation } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { registerTeacher } from "@/api/auth";
import { extractError } from "@/lib/api";
import { registerSchema, type RegisterValues } from "@/schemas/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { user, isReady, setSession } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isReady && user) router.replace("/teacher/dashboard");
  }, [user, isReady, router]);

  const mutation = useMutation({
    mutationFn: (v: RegisterValues) => registerTeacher(v.fullName, v.email, v.password),
    onSuccess: (data) => {
      setSession(data);
      toast({ title: "Hisob yaratildi", description: "Boshlash uchun panelga o'ting" });
      router.replace("/teacher/dashboard");
    },
    onError: (e) => toast({ variant: "destructive", title: "Xatolik", description: extractError(e) }),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>O'qituvchi ro'yxati</CardTitle>
          <CardDescription>Yangi o'qituvchi hisobini yarating</CardDescription>
        </CardHeader>
        <CardContent>
          <Formik<RegisterValues>
            initialValues={{ fullName: "", email: "", password: "", confirmPassword: "" }}
            validationSchema={registerSchema}
            onSubmit={(v) => mutation.mutate(v)}
          >
            <Form className="space-y-4">
              <FormField name="fullName" label="To'liq F.I.O" placeholder="Aliyev Vali" />
              <FormField name="email" label="Email" type="email" placeholder="teacher@school.uz" autoComplete="email" />
              <FormField name="password" label="Parol" type="password" autoComplete="new-password" />
              <FormField name="confirmPassword" label="Parolni takrorlang" type="password" autoComplete="new-password" />
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Saqlanmoqda..." : "Ro'yxatdan o'tish"}
              </Button>
            </Form>
          </Formik>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Hisobingiz bormi?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Kirish
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
