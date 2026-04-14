import { splitIntoVariants } from '../services/variant-splitter';
import { ParsedQuestion } from '../types';

function makeQuestion(index: number): ParsedQuestion {
  return {
    questionText: `Savol ${index + 1}`,
    optionA: `A variant ${index + 1}`,
    optionB: `B variant ${index + 1}`,
    optionC: `C variant ${index + 1}`,
    optionD: `D variant ${index + 1}`,
    correctAnswer: 'a',
  };
}

describe('splitIntoVariants', () => {
  it('25 ta savolni 4 variantga bo\'ladi (6 ta har birida, 1 tashlanadi)', () => {
    const questions = Array.from({ length: 25 }, (_, i) => makeQuestion(i));
    const result = splitIntoVariants(questions, 4);

    // 24 ta savol ishlatiladi (25 - 1 = 24)
    expect(result).toHaveLength(24);

    // Har bir variantda 6 ta savol
    for (let v = 1; v <= 4; v++) {
      const variantQuestions = result.filter((q) => q.variantNumber === v);
      expect(variantQuestions).toHaveLength(6);
    }
  });

  it('round-robin tartibida bo\'ladi', () => {
    const questions = Array.from({ length: 8 }, (_, i) => makeQuestion(i));
    const result = splitIntoVariants(questions, 4);

    // Variant 1: savollar 1, 5 (index 0, 4)
    const v1 = result.filter((q) => q.variantNumber === 1);
    expect(v1[0].questionText).toBe('Savol 1');
    expect(v1[1].questionText).toBe('Savol 5');

    // Variant 2: savollar 2, 6 (index 1, 5)
    const v2 = result.filter((q) => q.variantNumber === 2);
    expect(v2[0].questionText).toBe('Savol 2');
    expect(v2[1].questionText).toBe('Savol 6');

    // Variant 3: savollar 3, 7
    const v3 = result.filter((q) => q.variantNumber === 3);
    expect(v3[0].questionText).toBe('Savol 3');
    expect(v3[1].questionText).toBe('Savol 7');

    // Variant 4: savollar 4, 8
    const v4 = result.filter((q) => q.variantNumber === 4);
    expect(v4[0].questionText).toBe('Savol 4');
    expect(v4[1].questionText).toBe('Savol 8');
  });

  it('2 variantga bo\'ladi', () => {
    const questions = Array.from({ length: 10 }, (_, i) => makeQuestion(i));
    const result = splitIntoVariants(questions, 2);

    expect(result).toHaveLength(10);

    const v1 = result.filter((q) => q.variantNumber === 1);
    const v2 = result.filter((q) => q.variantNumber === 2);
    expect(v1).toHaveLength(5);
    expect(v2).toHaveLength(5);
  });

  it('6 variantga bo\'ladi', () => {
    const questions = Array.from({ length: 30 }, (_, i) => makeQuestion(i));
    const result = splitIntoVariants(questions, 6);

    expect(result).toHaveLength(30);
    for (let v = 1; v <= 6; v++) {
      expect(result.filter((q) => q.variantNumber === v)).toHaveLength(5);
    }
  });

  it('ortib qolgan savollarni tashlab yuboradi', () => {
    const questions = Array.from({ length: 7 }, (_, i) => makeQuestion(i));
    const result = splitIntoVariants(questions, 4);

    // 7 / 4 = 1 ta har birida, 4 ta ishlatiladi, 3 tashlanadi
    expect(result).toHaveLength(4);
  });

  it('questionOrder ni to\'g\'ri belgilaydi', () => {
    const questions = Array.from({ length: 12 }, (_, i) => makeQuestion(i));
    const result = splitIntoVariants(questions, 4);

    const v1 = result.filter((q) => q.variantNumber === 1);
    expect(v1[0].questionOrder).toBe(1);
    expect(v1[1].questionOrder).toBe(2);
    expect(v1[2].questionOrder).toBe(3);
  });

  it('bo\'sh massiv qaytaradi agar savollar yetarli bo\'lmasa', () => {
    const questions = Array.from({ length: 3 }, (_, i) => makeQuestion(i));
    const result = splitIntoVariants(questions, 4);

    // 3 / 4 = 0 ta har birida
    expect(result).toHaveLength(0);
  });
});
