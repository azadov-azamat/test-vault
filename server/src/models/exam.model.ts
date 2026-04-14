import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ExamAttributes {
  id: string;
  teacherId: string;
  title: string;
  variantCount: number;
  originalFilename: string;
}

type ExamCreationAttributes = Optional<ExamAttributes, 'id'>;

class Exam extends Model<ExamAttributes, ExamCreationAttributes> {
  declare id: string;
  declare teacherId: string;
  declare title: string;
  declare variantCount: number;
  declare originalFilename: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Exam.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    variantCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: [[2, 4, 6]],
      },
    },
    originalFilename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'exams',
  }
);

export default Exam;
