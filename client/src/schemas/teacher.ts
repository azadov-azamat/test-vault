import * as Yup from "yup";
import type { Translations } from "@/i18n/translations";

export function createStudentSchemaI18n(t: Translations) {
  return Yup.object({
    fullName: Yup.string().trim().min(2, t.validation.minChars(2)).required(t.validation.fioRequired),
  });
}

export const createStudentSchema = Yup.object({
  fullName: Yup.string().trim().min(2, "Kamida 2 ta belgi").required("F.I.O kiritilishi shart"),
});
export type CreateStudentValues = Yup.InferType<typeof createStudentSchema>;

const ALLOWED_EXTENSIONS = [".docx", ".pdf"];

export const createExamSchema = Yup.object({
  title: Yup.string().trim().min(3, "Kamida 3 ta belgi").required("Imtihon nomi kiritilishi shart"),
  variantCount: Yup.number().oneOf([2, 4, 6], "2, 4 yoki 6 bo'lishi kerak").required(),
  file: Yup.mixed<File>()
    .required("Fayl tanlanishi shart")
    .test("type", "Faqat .docx yoki .pdf fayl qabul qilinadi", (f) => {
      if (!(f instanceof File)) return false;
      const name = f.name.toLowerCase();
      return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
    }),
});
export type CreateExamValues = Yup.InferType<typeof createExamSchema>;
