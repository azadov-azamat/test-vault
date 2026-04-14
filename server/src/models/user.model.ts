import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type UserRole = 'teacher' | 'student';

interface UserAttributes {
  id: string;
  role: UserRole;
  fullName: string;
  email: string | null;
  login: string | null;
  passwordHash: string;
  plainPassword: string | null;
  teacherId: string | null;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'email' | 'login' | 'teacherId' | 'plainPassword'>;

class User extends Model<UserAttributes, UserCreationAttributes> {
  declare id: string;
  declare role: UserRole;
  declare fullName: string;
  declare email: string | null;
  declare login: string | null;
  declare passwordHash: string;
  declare plainPassword: string | null;
  declare teacherId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('teacher', 'student'),
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    login: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plainPassword: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'plain_password',
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

export default User;
