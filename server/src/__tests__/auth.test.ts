import jwt from 'jsonwebtoken';
import { generateTokens } from '../middleware/auth';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

describe('generateTokens', () => {
  it('access va refresh tokenlarni yaratadi', () => {
    const tokens = generateTokens('user-123', 'teacher');

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });

  it('access token to\'g\'ri ma\'lumotlarni saqlaydi', () => {
    const tokens = generateTokens('user-456', 'student');
    const decoded = jwt.verify(tokens.accessToken, 'test-secret') as any;

    expect(decoded.id).toBe('user-456');
    expect(decoded.role).toBe('student');
  });

  it('refresh token to\'g\'ri ma\'lumotlarni saqlaydi', () => {
    const tokens = generateTokens('user-789', 'teacher');
    const decoded = jwt.verify(tokens.refreshToken, 'test-refresh-secret') as any;

    expect(decoded.id).toBe('user-789');
    expect(decoded.role).toBe('teacher');
  });

  it('noto\'g\'ri secret bilan token verify bo\'lmaydi', () => {
    const tokens = generateTokens('user-123', 'teacher');

    expect(() => {
      jwt.verify(tokens.accessToken, 'wrong-secret');
    }).toThrow();
  });
});
