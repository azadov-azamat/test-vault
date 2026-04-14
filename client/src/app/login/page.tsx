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
import { login } from "@/api/auth";
import { extractError } from "@/lib/api";
import { loginSchema, type LoginValues } from "@/schemas/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, isReady, setSession } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isReady && user) {
      router.replace(user.role === "teacher" ? "/teacher/dashboard" : "/student/exams");
    }
  }, [user, isReady, router]);

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => login(values.identifier, values.password),
    onSuccess: (data) => {
      setSession(data);
      toast({ title: "Xush kelibsiz!", description: data.user.fullName });
      router.replace(data.role === "teacher" ? "/teacher/dashboard" : "/student/exams");
    },
    onError: (e) => toast({ variant: "destructive", title: "Kirish xatoligi", description: extractError(e) }),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Tizimga kirish</CardTitle>
          <CardDescription>Login (yoki email) va parolingizni kiriting</CardDescription>
        </CardHeader>
        <CardContent>
          <Formik<LoginValues>
            initialValues={{ identifier: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={(v) => mutation.mutate(v)}
          >
            <Form className="space-y-4">
              <FormField name="identifier" label="Login yoki email" placeholder="email@example.com / stv_xxxxxx" autoComplete="username" />
              <FormField name="password" label="Parol" type="password" autoComplete="current-password" />
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Tekshirilmoqda..." : "Kirish"}
              </Button>
            </Form>
          </Formik>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            O'qituvchi sifatida yangi hisobmi?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
