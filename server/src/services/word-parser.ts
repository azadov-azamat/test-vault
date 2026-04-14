import mammoth from 'mammoth';
import { parse } from 'node-html-parser';
import { parseQuestionsFromLines, LineInput, ParseResult } from './question-parser';

export async function parseWordFile(buffer: Buffer): Promise<ParseResult> {
  const result = await mammoth.convertToHtml({ buffer });
  const root = parse(result.value);

  const lines: LineInput[] = root.querySelectorAll('p').map((p) => {
    const innerHTML = p.innerHTML;
    return {
      text: p.text,
      bold: innerHTML.includes('<strong>') || innerHTML.includes('<b>'),
      underline: innerHTML.includes('<u>') || innerHTML.includes('text-decoration: underline'),
    };
  });

  return parseQuestionsFromLines(lines);
}
