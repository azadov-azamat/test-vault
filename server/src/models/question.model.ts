import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface QuestionAttributes {
  id: string;
  examId: string;
  variantNumber: number;
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string;
}

type QuestionCreationAttributes = Optional<QuestionAttributes, 'id'>;

class Question extends Model<QuestionAttributes, QuestionCreationAttributes> {
  declare id: string;
  declare examId: string;
  declare variantNumber: number;
  declare questionOrder: number;
  declare questionText: string;
  declare optionA: string;
  declare optionB: string;
  declare optionC: string | null;
  declare optionD: string | null;
  declare correctAnswer: string;
}

Question.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    variantNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    optionA: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    optionB: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    optionC: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    optionD: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    correctAnswer: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      validate: {
        isIn: [['a', 'b', 'c', 'd']],
      },
    },
  },
  {
    sequelize,
    tableName: 'questions',
    timestamps: false,
  }
);

export default Question;
