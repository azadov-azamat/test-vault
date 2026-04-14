import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ExamSessionAttributes {
  id: string;
  studentId: string;
  examId: string;
  variantNumber: number;
  startedAt: Date;
  finishedAt: Date | null;
}

type ExamSessionCreationAttributes = Optional<ExamSessionAttributes, 'id' | 'startedAt' | 'finishedAt'>;

class ExamSession extends Model<ExamSessionAttributes, ExamSessionCreationAttributes> {
  declare id: string;
  declare studentId: string;
  declare examId: string;
  declare variantNumber: number;
  declare startedAt: Date;
  declare finishedAt: Date | null;
}

ExamSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    variantNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    finishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'exam_sessions',
    timestamps: false,
  }
);

export default ExamSession;
