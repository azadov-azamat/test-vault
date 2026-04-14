# TestVault

O'qituvchilar uchun imtihon yaratish va talabalar uchun test topshirish platformasi. Word (.docx) yoki PDF fayllardan savollarni avtomatik tahlil qiladi, variantlarga ajratadi va natijalarni tahlil qiladi.

## Texnologiyalar

**Server:** Node.js, Express, TypeScript, Sequelize, PostgreSQL, JWT
**Client:** Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui, React Query, Formik

## Asosiy imkoniyatlar

- Word/PDF fayllardan savollarni avtomatik tahlil qilish (to'g'ri javobni bold/underline yoki `+` belgisi orqali aniqlash)
- Savollarni variantlarga avtomatik taqsimlash (2, 4 yoki 6 variant)
- Talabalar uchun login va parol avtomatik generatsiya
- Imtihon vaqtini cheklash (umumiy va har bir savol uchun)
- Natijalarni batafsil tahlil qilish
- O'zbek va rus tillarida xatolik xabarlari (i18n)

## O'rnatish

### Talablar

- Node.js 18+
- PostgreSQL
- Yarn

### Server

```bash
cd server
cp .env.example .env    # env sozlamalarini to'ldiring
yarn install
yarn migrate
yarn dev                # http://localhost:5000
```

### Client

```bash
cd client
cp .env.example .env.local   # API manzilini kiriting
yarn install
yarn dev                     # http://localhost:3000
```

### Muhit o'zgaruvchilari

**Server (.env):**

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/testvault
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CLIENT_URL=http://localhost:3000
```

**Client (.env.local):**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Loyiha tuzilishi

```
testvault/
├── server/
│   └── src/
│       ├── app.ts              # Express server
│       ├── config/             # Ma'lumotlar bazasi sozlamalari
│       ├── models/             # Sequelize modellari
│       ├── routes/             # API endpoint'lar
│       ├── controllers/        # Biznes logika
│       ├── middleware/         # Auth, upload, validation
│       ├── services/           # Fayl tahlil, i18n
│       └── migrations/
└── client/
    └── src/
        ├── app/                # Next.js sahifalar
        │   ├── login/
        │   ├── register/
        │   ├── teacher/        # Dashboard, imtihonlar, talabalar
        │   └── student/        # Imtihon topshirish, natijalar
        ├── api/                # API so'rovlar
        ├── components/         # UI komponentlar
        ├── hooks/              # useAuth, useToast
        └── lib/                # Yordamchi funksiyalar
```

## API

### Auth
- `POST /api/auth/register` — O'qituvchi ro'yxatdan o'tishi
- `POST /api/auth/login` — Tizimga kirish
- `POST /api/auth/refresh` — Tokenni yangilash

### O'qituvchi
- `POST /api/teacher/exams` — Imtihon yaratish (fayl yuklash)
- `GET /api/teacher/exams` — Imtihonlar ro'yxati
- `GET /api/teacher/exams/:id` — Imtihon tafsilotlari
- `GET /api/teacher/exams/:id/results` — Natijalar
- `POST /api/teacher/students` — Talaba yaratish
- `GET /api/teacher/students` — Talabalar ro'yxati

### Talaba
- `GET /api/student/exams` — Mavjud imtihonlar
- `POST /api/student/exams/:id/start` — Imtihonni boshlash
- `POST /api/student/sessions/:id/answer` — Javob yuborish
- `POST /api/student/sessions/:id/finish` — Imtihonni yakunlash

## Ma'lumotlar bazasi

| Jadval | Tavsif |
|--------|--------|
| **users** | O'qituvchilar va talabalar (role: teacher/student) |
| **exams** | Imtihon ma'lumotlari |
| **questions** | Savollar (variant bo'yicha taqsimlangan) |
| **exam_sessions** | Talaba imtihon urinishlari |
| **answers** | Talaba javoblari |

## Skriptlar

```bash
# Server
yarn dev          # Development server
yarn build        # TypeScript kompilatsiya
yarn start        # Production server
yarn migrate      # Migratsiyalarni bajarish
yarn seed         # Test ma'lumotlar
yarn test         # Testlarni bajarish

# Client
yarn dev          # Development server
yarn build        # Production build
yarn start        # Production server
```
