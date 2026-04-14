import path from 'path';
import { ParseResult } from './question-parser';
import { parseWordFile } from './word-parser';
import { parsePdfFile } from './pdf-parser';

export const SUPPORTED_EXTENSIONS = ['.docx', '.pdf'] as const;

export async function parseQuestionsFile(
  buffer: Buffer,
  originalName: string
): Promise<ParseResult> {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.docx') return parseWordFile(buffer);
  if (ext === '.pdf') return parsePdfFile(buffer);
  throw new Error(`Qo'llab-quvvatlanmaydigan format: ${ext}`);
}
