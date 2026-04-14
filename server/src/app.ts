import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import './models';

import authRoutes from './routes/auth.routes';
import teacherRoutes from './routes/teacher.routes';
import studentRoutes from './routes/student.routes';
import { errorHandler } from './middleware/error-handler';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") || [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://test-vault-rust.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export { app, sequelize };

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  sequelize.authenticate()
    .then(() => {
      console.log('PostgreSQL ga ulandi');
      app.listen(PORT, () => {
        console.log(`Server ${PORT}-portda ishga tushdi`);
      });
    })
    .catch((error) => {
      console.error('Server ishga tushirishda xatolik:', error);
      process.exit(1);
    });
}
