import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  // Yagona users jadvali — teacher va student rol orqali ajratiladi
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('teacher', 'student'),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // teacher'lar uchun; student'larda NULL
    },
    login: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // student'lar uchun; teacher'larda NULL
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: true, // faqat student'lar uchun
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  });

  await queryInterface.createTable('exams', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    variant_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    original_filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  });

  await queryInterface.createTable('questions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    exam_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'exams', key: 'id' },
      onDelete: 'CASCADE',
    },
    variant_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    question_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    option_a: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    option_b: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    option_c: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    option_d: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    correct_answer: {
      type: DataTypes.CHAR(1),
      allowNull: false,
    },
  });

  await queryInterface.createTable('exam_sessions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    exam_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'exams', key: 'id' },
      onDelete: 'CASCADE',
    },
    variant_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    finished_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.createTable('answers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'exam_sessions', key: 'id' },
      onDelete: 'CASCADE',
    },
    question_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'questions', key: 'id' },
      onDelete: 'CASCADE',
    },
    selected_answer: {
      type: DataTypes.CHAR(1),
      allowNull: false,
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  });

  // Indexes
  await queryInterface.addIndex('users', ['role']);
  await queryInterface.addIndex('users', ['teacher_id']);
  await queryInterface.addIndex('exams', ['teacher_id']);
  await queryInterface.addIndex('questions', ['exam_id', 'variant_number']);
  await queryInterface.addIndex('exam_sessions', ['student_id', 'exam_id']);
  await queryInterface.addIndex('answers', ['session_id']);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable('answers');
  await queryInterface.dropTable('exam_sessions');
  await queryInterface.dropTable('questions');
  await queryInterface.dropTable('exams');
  await queryInterface.dropTable('users');
  // ENUM tipini ham o'chiramiz (Postgres'da alohida type)
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
}
