import User from './user.model';
import Exam from './exam.model';
import Question from './question.model';
import ExamSession from './exam-session.model';
import Answer from './answer.model';

// Teacher o'z studentlariga ega (self-referential)
User.hasMany(User, { foreignKey: 'teacherId', as: 'students' });
User.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// Teacher (User role=teacher) o'z examlariga ega
User.hasMany(Exam, { foreignKey: 'teacherId', as: 'exams' });
Exam.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

Exam.hasMany(Question, { foreignKey: 'examId', as: 'questions' });
Question.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

// Student (User role=student) o'z sessionlariga ega
User.hasMany(ExamSession, { foreignKey: 'studentId', as: 'sessions' });
ExamSession.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

Exam.hasMany(ExamSession, { foreignKey: 'examId', as: 'sessions' });
ExamSession.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

ExamSession.hasMany(Answer, { foreignKey: 'sessionId', as: 'answers' });
Answer.belongsTo(ExamSession, { foreignKey: 'sessionId', as: 'session' });

Question.hasMany(Answer, { foreignKey: 'questionId', as: 'answers' });
Answer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

export { User, Exam, Question, ExamSession, Answer };
