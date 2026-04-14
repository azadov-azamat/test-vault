import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import sequelize from '../config/database';
import '../models';
import { User } from '../models';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('DB ga ulandi');

    const teacherPassword = await bcrypt.hash('123456', 10);

    const [teacher] = await User.findOrCreate({
      where: { email: 'teacher@test.com' },
      defaults: {
        role: 'teacher',
        fullName: 'Azimov Rustam',
        email: 'teacher@test.com',
        passwordHash: teacherPassword,
      },
    });

    console.log('Teacher:', {
      email: 'teacher@test.com',
      password: '123456',
    });

    const students = [
      { fullName: 'Karimov Ali', login: 'stv_ali001' },
      { fullName: 'Rahimova Nilufar', login: 'stv_nil002' },
      { fullName: 'Toshmatov Jasur', login: 'stv_jas003' },
      { fullName: 'Abdullayeva Madina', login: 'stv_mad004' },
      { fullName: 'Ergashev Sardor', login: 'stv_sar005' },
    ];

    const studentPassword = await bcrypt.hash('student123', 10);

    for (const s of students) {
      await User.findOrCreate({
        where: { login: s.login },
        defaults: {
          role: 'student',
          teacherId: teacher.id,
          fullName: s.fullName,
          login: s.login,
          passwordHash: studentPassword,
        },
      });
    }

    console.log('\nStudentlar:');
    console.log('Password (hammasi uchun): student123');
    console.log('─'.repeat(40));
    for (const s of students) {
      console.log(`  ${s.fullName} → login: ${s.login}`);
    }

    console.log('\nSeed muvaffaqiyatli bajarildi!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed xatolik:', error);
    process.exit(1);
  }
}

seed();
