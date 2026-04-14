import { parseWordFile } from '../services/word-parser';
import mammoth from 'mammoth';

jest.mock('mammoth');

const mockMammoth = mammoth as jest.Mocked<typeof mammoth>;

describe('parseWordFile', () => {
  it('oddiy savollarni parse qiladi', async () => {
    mockMammoth.convertToHtml.mockResolvedValue({
      value: `
        <p>1. Qanday rang?</p>
        <p>A) Qizil</p>
        <p><strong>B) Ko'k</strong></p>
        <p>C) Yashil</p>
        <p>D) Sariq</p>
      `,
      messages: [],
    });

    const result = (await parseWordFile(Buffer.from("test"))).questions;

    expect(result).toHaveLength(1);
    expect(result[0].questionText).toBe('Qanday rang?');
    expect(result[0].optionA).toBe('Qizil');
    expect(result[0].optionB).toBe("Ko'k");
    expect(result[0].optionC).toBe('Yashil');
    expect(result[0].optionD).toBe('Sariq');
    expect(result[0].correctAnswer).toBe('b');
  });

  it('underline bilan to\'g\'ri javobni aniqlaydi', async () => {
    mockMammoth.convertToHtml.mockResolvedValue({
      value: `
        <p>1. 2+2 nechaga teng?</p>
        <p>A) 3</p>
        <p>B) 5</p>
        <p><u>C) 4</u></p>
        <p>D) 6</p>
      `,
      messages: [],
    });

    const result = (await parseWordFile(Buffer.from("test"))).questions;

    expect(result).toHaveLength(1);
    expect(result[0].correctAnswer).toBe('c');
  });

  it('bir nechta savollarni parse qiladi', async () => {
    mockMammoth.convertToHtml.mockResolvedValue({
      value: `
        <p>1. Birinchi savol?</p>
        <p><strong>A) To'g'ri</strong></p>
        <p>B) Noto'g'ri</p>
        <p>C) Bilmayman</p>
        <p>D) Hech qaysi</p>
        <p>2. Ikkinchi savol?</p>
        <p>A) Bir</p>
        <p>B) Ikki</p>
        <p><strong>C) Uch</strong></p>
        <p>D) To'rt</p>
      `,
      messages: [],
    });

    const result = (await parseWordFile(Buffer.from("test"))).questions;

    expect(result).toHaveLength(2);
    expect(result[0].correctAnswer).toBe('a');
    expect(result[1].correctAnswer).toBe('c');
  });

  it('bo\'sh faylda bo\'sh massiv qaytaradi', async () => {
    mockMammoth.convertToHtml.mockResolvedValue({
      value: '<p></p>',
      messages: [],
    });

    const result = (await parseWordFile(Buffer.from("test"))).questions;
    expect(result).toHaveLength(0);
  });

  it('to\'g\'ri javobsiz savollarni o\'tkazib yuboradi', async () => {
    mockMammoth.convertToHtml.mockResolvedValue({
      value: `
        <p>1. Savol?</p>
        <p>A) Bir</p>
        <p>B) Ikki</p>
        <p>C) Uch</p>
        <p>D) To'rt</p>
      `,
      messages: [],
    });

    const result = (await parseWordFile(Buffer.from("test"))).questions;
    expect(result).toHaveLength(0);
  });
});
