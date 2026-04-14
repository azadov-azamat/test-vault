# TestVault Client

Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn-ui + react-query + formik/yup.

## Setup

```bash
cp .env.local.example .env.local
yarn install
yarn dev
```

`.env.local` da `NEXT_PUBLIC_API_URL` ni server manziliga sozlang (default: `http://localhost:5000/api`).

## Routes

- `/login`, `/register` — autentifikatsiya
- `/teacher/dashboard` — o'qituvchi paneli
- `/teacher/exams`, `/teacher/exams/new`, `/teacher/exams/:id/results`
- `/teacher/students`
- `/student/exams`, `/student/exams/:id`, `/student/exams/:id/take/:sessionId`

## Architecture

- `src/api/*` — backend API funksiyalari (axios)
- `src/lib/api.ts` — axios instance + JWT refresh interceptor
- `src/lib/auth-storage.ts` — localStorage'da token boshqaruvi
- `src/hooks/use-auth.tsx` — AuthContext
- `src/components/ui/*` — shadcn primitives
- `src/components/layout/*` — Protected route va AppShell
- `src/schemas/*` — Yup validatsiya sxemalari
