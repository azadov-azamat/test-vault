import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await queryInterface.addColumn('exams', 'starts_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
  await queryInterface.addColumn('exams', 'duration_minutes', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
  await queryInterface.addColumn('exams', 'minutes_per_question', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });
  await queryInterface.addColumn('exams', 'is_frozen', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.removeColumn('exams', 'starts_at');
  await queryInterface.removeColumn('exams', 'duration_minutes');
  await queryInterface.removeColumn('exams', 'minutes_per_question');
  await queryInterface.removeColumn('exams', 'is_frozen');
}
