import { ParsedQuestion } from '../types';

export interface Segment {
  str: string;
  bold?: boolean;
  underline?: boolean;
  fontName?: string;
}

export interface LineInput {
  text: string;
  segments?: Segment[];
  bold?: boolean;
  underline?: boolean;
}

export interface ParseStats {
  detected: number;
  withoutCorrectAnswer: number;
  incomplete: number;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  stats: ParseStats;
}

const QUESTION_RE = /^\d{1,3}\s*[\.\)]\s*(.+)/;

// Bitta qatordagi bir yoki bir necha variant (A..D) ni topadi.
// Kengaytirilgan: qator boshi yoki probel, keyin A/B/C/D, keyin . yoki )
// `+` yoki `*` marker harf oldi/keyin yoki tanadan oldin bo'lishi mumkin.
const OPTION_G_SRC = '(?:^|\\s)([+*]?)\\s*([A-Da-d])\\s*([+*]?)\\s*[\\.\\)]';

const ANSWER_LINE_RE = /^\s*(?:javob|to'g'ri\s+javob|togri\s+javob|ответ|правильный\s+ответ|answer|correct\s+answer)\s*[:\-]\s*([A-Da-d])\b/i;
const BARE_LETTER_RE = /^\s*([A-Da-d])\s*[\.\)]?\s*$/;

function isBoldAtPos(line: LineInput, pos: number): boolean {
  if (line.bold || line.underline) return true;
  if (!line.segments) return false;
  let acc = 0;
  for (const s of line.segments) {
    const end = acc + s.str.length;
    if (pos >= acc && pos < end) return !!s.bold || !!s.underline;
    acc = end;
  }
  return false;
}

function fontNameAtPos(line: LineInput, pos: number): string | undefined {
  if (!line.segments) return undefined;
  let acc = 0;
  for (const s of line.segments) {
    const end = acc + s.str.length;
    if (pos >= acc && pos < end) return s.fontName;
    acc = end;
  }
  return undefined;
}

interface ExtractedOption {
  letter: 'a' | 'b' | 'c' | 'd';
  text: string;
  correct: boolean;
  fontName?: string;
}

function extractOptionsFromLine(line: LineInput): ExtractedOption[] {
  const text = line.text;
  const re = new RegExp(OPTION_G_SRC, 'g');
  const matches: Array<{ index: number; mlen: number; letter: string; marker: boolean; letterPos: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const fullLen = m[0].length;
    const markerBefore = m[1];
    const letter = m[2].toLowerCase();
    const markerAfter = m[3];
    const letterRel = m[0].indexOf(m[2]);
    matches.push({
      index: m.index,
      mlen: fullLen,
      letter,
      marker: Boolean(markerBefore || markerAfter),
      letterPos: m.index + letterRel,
    });
  }

  const results: ExtractedOption[] = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const nextStart = i + 1 < matches.length ? matches[i + 1].index : text.length;
    let optText = text.slice(cur.index + cur.mlen, nextStart).trim();

    let bodyMarker = false;
    if (/^[+*]\s*/.test(optText)) {
      bodyMarker = true;
      optText = optText.replace(/^[+*]\s*/, '').trim();
    }
    if (!optText) continue;

    const bold = isBoldAtPos(line, cur.letterPos);
    const correct = cur.marker || bodyMarker || bold;
    const fontName = fontNameAtPos(line, cur.letterPos);
    results.push({ letter: cur.letter as ExtractedOption['letter'], text: optText, correct, fontName });
  }
  return results;
}

export function parseQuestionsFromLines(lines: LineInput[]): ParseResult {
  const questions: ParsedQuestion[] = [];
  const stats: ParseStats = { detected: 0, withoutCorrectAnswer: 0, incomplete: 0 };

  // Hujjat bo'yicha eng ko'p ishlatilgan fontName "asosiy" font hisoblanadi.
  // Boldni aniqlash uchun: agar variant harfi shu asosiy fontdan farq qilsa, u ehtimol bold.
  const fontUsage = new Map<string, number>();
  for (const line of lines) {
    if (!line.segments) continue;
    for (const s of line.segments) {
      if (s.fontName) fontUsage.set(s.fontName, (fontUsage.get(s.fontName) || 0) + s.str.length);
    }
  }
  let dominantFont: string | undefined;
  let maxCount = 0;
  for (const [name, count] of fontUsage) {
    if (count > maxCount) { maxCount = count; dominantFont = name; }
  }

  let current: Partial<ParsedQuestion> | null = null;
  let correctAnswer: string | null = null;
  let hadOptions = false;
  let optionFonts: Record<string, string | undefined> = {};

  const flush = () => {
    if (!current?.questionText) return;
    stats.detected += 1;
    if (!current.optionA || !current.optionB) { stats.incomplete += 1; return; }

    // Agar bold/marker bo'yicha topilmagan bo'lsa, font-outlier evristikasi:
    // 4 variantdan bittasi asosiy fontdan farq qilsa, uni to'g'ri javob deb belgilaymiz.
    if (!correctAnswer && dominantFont) {
      const letters = ['a', 'b', 'c', 'd'] as const;
      const nonDominant = letters.filter((l) => optionFonts[l] && optionFonts[l] !== dominantFont);
      if (nonDominant.length === 1) correctAnswer = nonDominant[0];
    }

    if (!correctAnswer) { stats.withoutCorrectAnswer += 1; return; }
    current.correctAnswer = correctAnswer;
    questions.push(current as ParsedQuestion);
  };

  const startNew = (text: string) => {
    current = { questionText: text, optionA: '', optionB: '', optionC: null, optionD: null };
    correctAnswer = null;
    hadOptions = false;
    optionFonts = {};
  };

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    if (current) {
      const answerLine = text.match(ANSWER_LINE_RE);
      if (answerLine) { correctAnswer = answerLine[1].toLowerCase(); continue; }
    }

    const opts = extractOptionsFromLine(line);

    const questionMatch = text.match(QUESTION_RE);
    if (questionMatch && opts.length === 0) {
      flush();
      startNew(questionMatch[1].trim());
      continue;
    }

    if (opts.length > 0 && current) {
      const q: Partial<ParsedQuestion> = current;
      for (const o of opts) {
        switch (o.letter) {
          case 'a': q.optionA = o.text; break;
          case 'b': q.optionB = o.text; break;
          case 'c': q.optionC = o.text; break;
          case 'd': q.optionD = o.text; break;
        }
        optionFonts[o.letter] = o.fontName;
        if (o.correct) correctAnswer = o.letter;
      }
      hadOptions = true;
      continue;
    }

    if (current) {
      const bareLetter = text.match(BARE_LETTER_RE);
      if (bareLetter && hadOptions && !correctAnswer) {
        correctAnswer = bareLetter[1].toLowerCase();
        continue;
      }
      if (!hadOptions) {
        const q: Partial<ParsedQuestion> = current;
        q.questionText = ((q.questionText || '') + ' ' + text).trim();
        continue;
      }
    }
  }

  flush();
  return { questions, stats };
}
