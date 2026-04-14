import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AnswerAttributes {
  id: string;
  sessionId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

type AnswerCreationAttributes = Optional<AnswerAttributes, 'id'>;

class Answer extends Model<AnswerAttributes, AnswerCreationAttributes> {
  declare id: string;
  declare sessionId: string;
  declare questionId: string;
  declare selectedAnswer: string;
  declare isCorrect: boolean;
}

Answer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    selectedAnswer: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      validate: {
        isIn: [['a', 'b', 'c', 'd']],
      },
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'answers',
    timestamps: false,
  }
);

export default Answer;
