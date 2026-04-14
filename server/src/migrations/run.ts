import sequelize from '../config/database';
import { up as up001, down as down001 } from './001-initial';
import { up as up002, down as down002 } from './002-add-plain-password';
import { up as up003, down as down003 } from './003-add-exam-schedule';

const migrations = [
  { name: '001-initial', up: up001, down: down001 },
  { name: '002-add-plain-password', up: up002, down: down002 },
  { name: '003-add-exam-schedule', up: up003, down: down003 },
];

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('DB ga ulandi');

    const qi = sequelize.getQueryInterface();
    const arg = process.argv[2];

    if (arg === 'down') {
      for (const m of [...migrations].reverse()) {
        try {
          await m.down(qi);
          console.log(`${m.name}: down`);
        } catch (e) {
          console.warn(`${m.name}: down skipped (${(e as Error).message})`);
        }
      }
    } else {
      for (const m of migrations) {
        try {
          await m.up(qi);
          console.log(`${m.name}: up`);
        } catch (e) {
          console.warn(`${m.name}: up skipped (${(e as Error).message})`);
        }
      }
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration xatolik:', error);
    process.exit(1);
  }
}

migrate();
