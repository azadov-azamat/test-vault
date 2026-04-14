import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ExamAttributes {
  id: string;
  teacherId: string;
  title: string;
  variantCount: number;
  originalFilename: string;
  startsAt: Date | null;
  durationMinutes: number | null;
  minutesPerQuestion: number | null;
  isFrozen: boolean;
}

type ExamCreationAttributes = Optional<
  ExamAttributes,
  'id' | 'startsAt' | 'durationMinutes' | 'minutesPerQuestion' | 'isFrozen'
>;

class Exam extends Model<ExamAttributes, ExamCreationAttributes> {
  declare id: string;
  declare teacherId: string;
  declare title: string;
  declare variantCount: number;
  declare originalFilename: string;
  declare startsAt: Date | null;
  declare durationMinutes: number | null;
  declare minutesPerQuestion: number | null;
  declare isFrozen: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Exam.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    teacherId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    variantCount: { type: DataTypes.INTEGER, allowNull: false, validate: { isIn: [[2, 4, 6]] } },
    originalFilename: { type: DataTypes.STRING, allowNull: false },
    startsAt: { type: DataTypes.DATE, allowNull: true, field: 'starts_at' },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_minutes' },
    minutesPerQuestion: { type: DataTypes.INTEGER, allowNull: true, field: 'minutes_per_question' },
    isFrozen: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_frozen' },
  },
  { sequelize, tableName: 'exams' }
);

export default Exam;
