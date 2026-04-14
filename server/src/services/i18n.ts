type Lang = 'uz' | 'ru';

const messages: Record<string, Record<Lang, string>> = {
  // Auth
  'auth.email_exists': {
    uz: "Bu email allaqachon ro'yxatdan o'tgan",
    ru: 'Этот email уже зарегистрирован',
  },
  'auth.invalid_credentials': {
    uz: "Email yoki parol noto'g'ri",
    ru: 'Неверный email или пароль',
  },
  'auth.invalid_student_credentials': {
    uz: "Login yoki parol noto'g'ri",
    ru: 'Неверный логин или пароль',
  },
  'auth.token_missing': {
    uz: 'Token topilmadi',
    ru: 'Токен не найден',
  },
  'auth.token_invalid': {
    uz: 'Token yaroqsiz',
    ru: 'Токен недействителен',
  },
  'auth.teacher_only': {
    uz: "Faqat o'qituvchilar uchun",
    ru: 'Только для преподавателей',
  },
  'auth.student_only': {
    uz: 'Faqat talabalar uchun',
    ru: 'Только для студентов',
  },
  'auth.refresh_required': {
    uz: 'Refresh token kerak',
    ru: 'Требуется refresh токен',
  },
  'auth.refresh_invalid': {
    uz: 'Refresh token yaroqsiz',
    ru: 'Refresh токен недействителен',
  },

  // Validation
  'validation.fullname_required': {
    uz: "To'liq ism kiritilishi shart",
    ru: 'Необходимо указать полное имя',
  },
  'validation.email_invalid': {
    uz: "Email formati noto'g'ri",
    ru: 'Неверный формат email',
  },
  'validation.email_required': {
    uz: 'Email kiritilishi shart',
    ru: 'Необходимо указать email',
  },
  'validation.password_required': {
    uz: 'Parol kiritilishi shart',
    ru: 'Необходимо указать пароль',
  },
  'validation.password_min': {
    uz: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
    ru: 'Пароль должен содержать минимум 6 символов',
  },
  'validation.login_required': {
    uz: 'Login kiritilishi shart',
    ru: 'Необходимо указать логин',
  },
  'validation.variant_invalid': {
    uz: "Variant raqami noto'g'ri",
    ru: 'Неверный номер варианта',
  },
  'validation.question_id_invalid': {
    uz: "Savol ID noto'g'ri",
    ru: 'Неверный ID вопроса',
  },
  'validation.answer_invalid': {
    uz: "Javob a, b, c yoki d bo'lishi kerak",
    ru: 'Ответ должен быть a, b, c или d',
  },

  // Exam
  'exam.file_required': {
    uz: 'Fayl (.docx yoki .pdf) yuklang',
    ru: 'Загрузите файл (.docx или .pdf)',
  },
  'exam.variant_count_invalid': {
    uz: "Variant soni 2, 4 yoki 6 bo'lishi kerak",
    ru: 'Количество вариантов должно быть 2, 4 или 6',
  },
  'exam.not_enough_questions': {
    uz: "Kamida {count} ta savol bo'lishi kerak. Topilgan: {found}",
    ru: 'Необходимо минимум {count} вопросов. Найдено: {found}',
  },
  'exam.not_found': {
    uz: 'Exam topilmadi',
    ru: 'Экзамен не найден',
  },

  // Student
  'student.not_found': {
    uz: 'Talaba topilmadi',
    ru: 'Студент не найден',
  },

  // Test session
  'session.active_exists': {
    uz: 'Sizda tugallanmagan test mavjud',
    ru: 'У вас есть незавершенный тест',
  },
  'session.not_found': {
    uz: 'Aktiv sessiya topilmadi',
    ru: 'Активная сессия не найдена',
  },
  'session.question_not_found': {
    uz: 'Savol topilmadi',
    ru: 'Вопрос не найден',
  },
  'session.already_answered': {
    uz: 'Bu savolga allaqachon javob berilgan',
    ru: 'На этот вопрос уже дан ответ',
  },

  // General
  'error.server': {
    uz: 'Server xatoligi',
    ru: 'Ошибка сервера',
  },
  'error.docx_only': {
    uz: 'Faqat .docx yoki .pdf formatdagi fayllar qabul qilinadi',
    ru: 'Принимаются только файлы в формате .docx или .pdf',
  },
};

export function t(key: string, lang: Lang = 'uz', params?: Record<string, string | number>): string {
  const msg = messages[key]?.[lang] || messages[key]?.uz || key;

  if (!params) return msg;

  return Object.entries(params).reduce(
    (result, [k, v]) => result.replace(`{${k}}`, String(v)),
    msg
  );
}

export function getLang(acceptLanguage?: string): Lang {
  if (!acceptLanguage) return 'uz';
  if (acceptLanguage.includes('ru')) return 'ru';
  return 'uz';
}
