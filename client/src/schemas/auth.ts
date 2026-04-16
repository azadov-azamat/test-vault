import * as Yup from "yup";
import type { Translations } from "@/i18n/translations";

export function createLoginSchema(t: Translations) {
  return Yup.object({
    identifier: Yup.string().trim().required(t.validation.identifierRequired),
    password: Yup.string().required(t.validation.passwordRequired),
  });
}

export const loginSchema = Yup.object({
  identifier: Yup.string().trim().required("Login yoki email kiritilishi shart"),
  password: Yup.string().required("Parol kiritilishi shart"),
});

export type LoginValues = Yup.InferType<typeof loginSchema>;

export function createRegisterSchema(t: Translations) {
  return Yup.object({
    fullName: Yup.string().trim().min(2, t.validation.minChars(2)).required(t.validation.fullNameRequired),
    email: Yup.string().email(t.validation.emailInvalid).required(t.validation.emailRequired),
    password: Yup.string().min(6, t.validation.minChars(6)).required(t.validation.passwordRequired),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t.validation.passwordsMismatch)
      .required(t.validation.confirmPassword),
  });
}

export const registerSchema = Yup.object({
  fullName: Yup.string().trim().min(2, "Kamida 2 ta belgi").required("To'liq ism kiritilishi shart"),
  email: Yup.string().email("Email noto'g'ri").required("Email kiritilishi shart"),
  password: Yup.string().min(6, "Kamida 6 ta belgi").required("Parol kiritilishi shart"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Parollar mos emas")
    .required("Parolni takrorlang"),
});

export type RegisterValues = Yup.InferType<typeof registerSchema>;
