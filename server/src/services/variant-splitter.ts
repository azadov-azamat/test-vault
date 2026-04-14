import { ParsedQuestion, VariantQuestion } from '../types';

export function splitIntoVariants(
  questions: ParsedQuestion[],
  variantCount: number
): VariantQuestion[] {
  const questionsPerVariant = Math.floor(questions.length / variantCount);
  const totalUsed = questionsPerVariant * variantCount;

  const result: VariantQuestion[] = [];

  for (let i = 0; i < totalUsed; i++) {
    const variantNumber = (i % variantCount) + 1;
    const questionOrder = Math.floor(i / variantCount) + 1;

    result.push({
      ...questions[i],
      variantNumber,
      questionOrder,
    });
  }

  return result;
}
