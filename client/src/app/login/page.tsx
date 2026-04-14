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
import { useLang } from "@/i18n/context";
import { LangSwitcher } from "@/components/layout/lang-switcher";
import { login } from "@/api/auth";
import { extractError } from "@/lib/api";
import { loginSchema, type LoginValues } from "@/schemas/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, isReady, setSession } = useAuth();
  const { toast } = useToast();
  const { t } = useLang();

  useEffect(() => {
    if (isReady && user) {
      router.replace(user.role === "teacher" ? "/teacher/dashboard" : "/student/exams");
    }
  }, [user, isReady, router]);

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => login(values.identifier, values.password),
    onSuccess: (data) => {
      setSession(data);
      toast({ title: t.login.welcome, description: data.user.fullName });
      router.replace(data.role === "teacher" ? "/teacher/dashboard" : "/student/exams");
    },
    onError: (e) => toast({ variant: "destructive", title: t.login.loginError, description: extractError(e) }),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t.login.title}</CardTitle>
          <CardDescription>{t.login.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Formik<LoginValues>
            initialValues={{ identifier: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={(v) => mutation.mutate(v)}
          >
            <Form className="space-y-4">
              <FormField name="identifier" label={t.login.identifierLabel} placeholder={t.login.identifierPlaceholder} autoComplete="username" />
              <FormField name="password" label={t.login.passwordLabel} type="password" autoComplete="current-password" />
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? t.login.submitting : t.login.submit}
              </Button>
            </Form>
          </Formik>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t.login.newTeacher}{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                {t.login.registerLink}
              </Link>
            </p>
            <LangSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
