import * as Yup from "yup";

export const loginSchema = Yup.object({
  identifier: Yup.string().trim().required("Login yoki email kiritilishi shart"),
  password: Yup.string().required("Parol kiritilishi shart"),
});

export type LoginValues = Yup.InferType<typeof loginSchema>;

export const registerSchema = Yup.object({
  fullName: Yup.string().trim().min(2, "Kamida 2 ta belgi").required("To'liq ism kiritilishi shart"),
  email: Yup.string().email("Email noto'g'ri").required("Email kiritilishi shart"),
  password: Yup.string().min(6, "Kamida 6 ta belgi").required("Parol kiritilishi shart"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Parollar mos emas")
    .required("Parolni takrorlang"),
});

export type RegisterValues = Yup.InferType<typeof registerSchema>;
