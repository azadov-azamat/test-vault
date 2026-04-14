import { parseQuestionsFromLines, ParseResult, LineInput, Segment } from './question-parser';

interface PdfItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontFamily: string;
  bold: boolean;
}

// pdfjs-dist v5 is ESM-only; bypass TS CJS transpilation with Function-wrapped import.
const dynamicImport: (spec: string) => Promise<any> = new Function(
  's',
  'return import(s);'
) as any;

async function loadPdfjs() {
  return await dynamicImport('pdfjs-dist/legacy/build/pdf.mjs');
}

const BOLD_RE = /bold|black|heavy|semibold|demi|extrab|ultrab|cmbx|cmbsy/i;

export async function parsePdfFile(buffer: Buffer): Promise<ParseResult> {
  const pdfjs = await loadPdfjs();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    fontExtraProperties: true,
    verbosity: 0,
  });

  const doc = await loadingTask.promise;
  const lines: LineInput[] = [];

  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const styles: Record<string, any> = (content as any).styles ?? {};

      const items: PdfItem[] = (content.items as any[])
        .filter((it) => typeof it.str === 'string' && it.str.length > 0)
        .map((it) => {
          const fontName = String(it.fontName ?? '');
          const fontFamily = String(styles[fontName]?.fontFamily ?? '');
          const bold = BOLD_RE.test(fontFamily) || BOLD_RE.test(fontName);
          return {
            str: it.str as string,
            x: Number(it.transform[4]),
            y: Number(it.transform[5]),
            width: Number(it.width),
            height: Number(it.height || styles[fontName]?.ascent || 10),
            fontName,
            fontFamily,
            bold,
          };
        });

      if (items.length === 0) continue;

      const columns = detectColumns(items, viewport.width);
      for (const col of columns) {
        for (const group of groupIntoLines(col)) {
          const built = buildLine(group);
          if (built.text.trim()) lines.push(built);
        }
      }
    }
  } finally {
    await doc.destroy?.().catch?.(() => undefined);
  }

  return parseQuestionsFromLines(lines);
}

function detectColumns(items: PdfItem[], pageWidth: number): PdfItem[][] {
  if (items.length < 20) return [items];

  // Header/footer ni inkor qilish uchun y bo'yicha 10-90% diapazonni olamiz.
  const ys = items.map((i) => i.y).sort((a, b) => a - b);
  const yMin = ys[Math.floor(ys.length * 0.1)];
  const yMax = ys[Math.floor(ys.length * 0.9)];
  const bodyItems = items.filter((i) => i.y >= yMin && i.y <= yMax);

  const minMid = pageWidth * 0.3;
  const maxMid = pageWidth * 0.7;
  const xs = bodyItems.map((i) => i.x).sort((a, b) => a - b);
  let bestGap = 0;
  let bestMid = 0;
  for (let i = 1; i < xs.length; i++) {
    const mid = (xs[i] + xs[i - 1]) / 2;
    const gap = xs[i] - xs[i - 1];
    if (mid < minMid || mid > maxMid) continue;
    if (gap > bestGap) { bestGap = gap; bestMid = mid; }
  }

  if (bestGap > pageWidth * 0.04) {
    const left = items.filter((i) => i.x < bestMid);
    const right = items.filter((i) => i.x >= bestMid);
    if (left.length > items.length * 0.2 && right.length > items.length * 0.2) {
      return [left, right];
    }
  }
  return [items];
}

function groupIntoLines(items: PdfItem[]): PdfItem[][] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PdfItem[][] = [];
  for (const it of sorted) {
    let placed = false;
    for (const line of lines) {
      // Subscript/superscriptlarni bir qatorda saqlash uchun font height ning
      // ~55% gacha farqni tolerantlik sifatida olamiz.
      const tol = Math.max(it.height, line[0].height) * 0.55;
      if (Math.abs(line[0].y - it.y) <= Math.max(tol, 2.5)) {
        line.push(it);
        placed = true;
        break;
      }
    }
    if (!placed) lines.push([it]);
  }
  lines.sort((a, b) => b[0].y - a[0].y);
  return lines;
}

function buildLine(items: PdfItem[]): LineInput {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const segments: Segment[] = [];
  let text = '';
  let prevRight = -Infinity;
  for (const it of sorted) {
    if (prevRight !== -Infinity) {
      const gap = it.x - prevRight;
      if (gap > 1.5) {
        text += ' ';
        segments.push({ str: ' ', bold: false });
      }
    }
    text += it.str;
    segments.push({ str: it.str, bold: it.bold, fontName: it.fontName });
    prevRight = it.x + it.width;
  }
  return { text, segments };
}
