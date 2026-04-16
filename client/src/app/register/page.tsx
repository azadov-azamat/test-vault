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
import { registerTeacher } from "@/api/auth";
import { extractError } from "@/lib/api";
import { createRegisterSchema, type RegisterValues } from "@/schemas/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { user, isReady, setSession } = useAuth();
  const { toast } = useToast();
  const { t } = useLang();

  useEffect(() => {
    if (isReady && user) router.replace("/teacher/dashboard");
  }, [user, isReady, router]);

  const mutation = useMutation({
    mutationFn: (v: RegisterValues) => registerTeacher(v.fullName, v.email, v.password),
    onSuccess: (data) => {
      setSession(data);
      toast({ title: t.register.success, description: t.register.successDescription });
      router.replace("/teacher/dashboard");
    },
    onError: (e) => toast({ variant: "destructive", title: t.error, description: extractError(e) }),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t.register.title}</CardTitle>
          <CardDescription>{t.register.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Formik<RegisterValues>
            initialValues={{ fullName: "", email: "", password: "", confirmPassword: "" }}
            validationSchema={createRegisterSchema(t)}
            onSubmit={(v) => mutation.mutate(v)}
          >
            <Form className="space-y-4">
              <FormField name="fullName" label={t.register.fullNameLabel} placeholder={t.register.fullNamePlaceholder} />
              <FormField name="email" label={t.register.emailLabel} type="email" placeholder={t.register.emailPlaceholder} autoComplete="email" />
              <FormField name="password" label={t.register.passwordLabel} type="password" autoComplete="new-password" />
              <FormField name="confirmPassword" label={t.register.confirmPasswordLabel} type="password" autoComplete="new-password" />
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? t.register.submitting : t.register.submit}
              </Button>
            </Form>
          </Formik>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t.register.hasAccount}{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                {t.register.loginLink}
              </Link>
            </p>
            <LangSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
