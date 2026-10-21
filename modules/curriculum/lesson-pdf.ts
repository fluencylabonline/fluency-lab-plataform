import "server-only";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { JSONContent } from "@tiptap/core";
import type { QuizData } from "./curriculum.types";

// Gera o PDF imprimível de uma lição (conteúdo Tiptap + exercícios + gabarito).
// Fontes padrão do PDF (WinAnsi): caracteres fora dessa tabela são trocados por equivalentes.

interface LessonPdfInput {
  title: string;
  difficulty: string;
  contentJson?: JSONContent | null;
  quizData?: QuizData | null;
  subtitle?: string;
}

interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

type Block =
  | { kind: "heading"; level: number; runs: Run[] }
  | { kind: "paragraph"; runs: Run[]; indent?: number; prefix?: string; quote?: boolean }
  | { kind: "rule" }
  | { kind: "space"; size: number }
  /** Garante espaço na página para o que vem a seguir (ex.: pergunta + alternativas). */
  | { kind: "keep"; height: number };

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BODY_SIZE = 10.5;
const LINE_GAP = 1.45;

const BRAND = rgb(0.231, 0.267, 0.894);
const TEXT = rgb(0.13, 0.15, 0.2);
const MUTED = rgb(0.42, 0.45, 0.52);
const QUOTE_BAR = rgb(0.8, 0.82, 0.95);

const REPLACEMENTS: Record<string, string> = {
  "→": "->",
  "←": "<-",
  "✓": "v",
  "✔": "v",
  "✗": "x",
  "❌": "x",
  "✅": "v",
  " ": " ",
};

// ── Tiptap → blocos ────────────────────────────────────────────────────────

function inlineRuns(node: JSONContent | undefined): Run[] {
  const runs: Run[] = [];
  for (const child of node?.content ?? []) {
    if (child.type === "text" && child.text) {
      const marks = child.marks?.map((m) => m.type) ?? [];
      runs.push({ text: child.text, bold: marks.includes("bold"), italic: marks.includes("italic") });
    } else if (child.type === "hardBreak") {
      runs.push({ text: "\n" });
    }
  }
  return runs;
}

function collectBlocks(nodes: JSONContent[] | undefined, depth = 0, quote = false): Block[] {
  const blocks: Block[] = [];
  for (const node of nodes ?? []) {
    switch (node.type) {
      case "heading":
        blocks.push({ kind: "heading", level: Number(node.attrs?.level ?? 2), runs: inlineRuns(node) });
        break;
      case "paragraph": {
        const runs = inlineRuns(node);
        if (runs.length) blocks.push({ kind: "paragraph", runs, indent: depth, quote });
        else blocks.push({ kind: "space", size: 6 });
        break;
      }
      case "bulletList":
      case "orderedList": {
        const start = Number(node.attrs?.start ?? 1);
        (node.content ?? []).forEach((item, idx) => {
          const [first, ...rest] = item.content ?? [];
          const prefix = node.type === "orderedList" ? `${start + idx}.` : "•";
          blocks.push({ kind: "paragraph", runs: inlineRuns(first), indent: depth + 1, prefix, quote });
          blocks.push(...collectBlocks(rest, depth + 1, quote));
        });
        break;
      }
      case "blockquote":
        blocks.push(...collectBlocks(node.content, depth, true));
        break;
      case "horizontalRule":
        blocks.push({ kind: "rule" });
        break;
      case "codeBlock":
        blocks.push({ kind: "paragraph", runs: inlineRuns(node), indent: depth });
        break;
      default:
        blocks.push(...collectBlocks(node.content, depth, quote));
    }
  }
  return blocks;
}

function quizBlocks(quiz: QuizData | null | undefined): { exercises: Block[]; answers: Block[] } {
  const questions = quiz?.questions ?? quiz?.quiz_sections?.flatMap((s) => s.questions) ?? [];
  if (!questions.length) return { exercises: [], answers: [] };

  const exercises: Block[] = [
    { kind: "heading", level: 2, runs: [{ text: "Quiz: teste o que você aprendeu" }] },
    { kind: "paragraph", runs: [{ text: "Marque a alternativa correta. O gabarito está no final.", italic: true }] },
  ];
  const answers: Block[] = [{ kind: "heading", level: 2, runs: [{ text: "Gabarito do quiz" }] }];

  questions.forEach((q, idx) => {
    exercises.push({ kind: "space", size: 4 });
    exercises.push({ kind: "keep", height: (q.options.length + 2) * BODY_SIZE * LINE_GAP + 12 });
    exercises.push({ kind: "paragraph", runs: [{ text: `${idx + 1}. ${q.text}`, bold: true }] });
    q.options.forEach((option, optIdx) => {
      exercises.push({
        kind: "paragraph",
        runs: [{ text: `(   ) ${String.fromCharCode(97 + optIdx)}) ${option}` }],
        indent: 1,
      });
    });

    const correct =
      q.correctAnswer ?? (q.correctIndex !== undefined ? q.options[q.correctIndex] : undefined) ?? "—";
    const letter = q.options.indexOf(correct);
    answers.push({
      kind: "paragraph",
      runs: [
        { text: `${idx + 1}. `, bold: true },
        { text: letter >= 0 ? `${String.fromCharCode(97 + letter)}) ${correct}` : correct, bold: true },
        ...(q.explanation ? [{ text: ` — ${q.explanation}` }] : []),
      ],
    });
  });

  return { exercises, answers };
}

// ── Layout ────────────────────────────────────────────────────────────────

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

class Writer {
  page!: PDFPage;
  y = 0;
  private pages: PDFPage[] = [];
  private encodable = new Map<string, boolean>();

  constructor(private doc: PDFDocument, private fonts: Fonts) {
    this.addPage();
  }

  addPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pages.push(this.page);
    this.y = PAGE_H - MARGIN;
  }

  ensure(height: number) {
    if (this.y - height < MARGIN + 20) this.addPage();
  }

  sanitize(text: string): string {
    let out = "";
    for (const ch of text) {
      const mapped = REPLACEMENTS[ch] ?? ch;
      if (mapped !== ch) {
        out += mapped;
        continue;
      }
      if (!this.encodable.has(ch)) {
        try {
          this.fonts.regular.encodeText(ch);
          this.encodable.set(ch, true);
        } catch {
          this.encodable.set(ch, false);
        }
      }
      out += this.encodable.get(ch) ? ch : "";
    }
    return out;
  }

  fontFor(run: Run) {
    if (run.bold && run.italic) return this.fonts.boldItalic;
    if (run.bold) return this.fonts.bold;
    if (run.italic) return this.fonts.italic;
    return this.fonts.regular;
  }

  /** Quebra as palavras (mantendo o estilo de cada uma) em linhas que cabem na largura. */
  wrap(runs: Run[], size: number, width: number): { text: string; run: Run }[][] {
    const lines: { text: string; run: Run }[][] = [[]];
    let lineWidth = 0;

    for (const run of runs) {
      const parts = this.sanitize(run.text).split(/(\n| )/);
      for (const part of parts) {
        if (part === "\n") {
          lines.push([]);
          lineWidth = 0;
          continue;
        }
        if (part === "") continue;
        const font = this.fontFor(run);
        const partWidth = font.widthOfTextAtSize(part, size);
        const current = lines[lines.length - 1];
        if (part === " ") {
          if (current.length) {
            current.push({ text: " ", run });
            lineWidth += partWidth;
          }
          continue;
        }
        if (lineWidth + partWidth > width && current.length) {
          while (current.length && current[current.length - 1].text === " ") current.pop();
          lines.push([{ text: part, run }]);
          lineWidth = partWidth;
        } else {
          current.push({ text: part, run });
          lineWidth += partWidth;
        }
      }
    }
    return lines.filter((line, idx) => line.length || idx === 0);
  }

  drawRuns(runs: Run[], opts: { size: number; x: number; width: number; color?: ReturnType<typeof rgb>; prefix?: string }) {
    const lineHeight = opts.size * LINE_GAP;
    const lines = this.wrap(runs, opts.size, opts.width);
    lines.forEach((line, lineIdx) => {
      this.ensure(lineHeight);
      if (lineIdx === 0 && opts.prefix) {
        const prefix = this.sanitize(opts.prefix);
        const prefixWidth = this.fonts.regular.widthOfTextAtSize(prefix, opts.size);
        this.page.drawText(prefix, {
          x: opts.x - prefixWidth - 5,
          y: this.y - opts.size,
          size: opts.size,
          font: this.fonts.regular,
          color: opts.color ?? TEXT,
        });
      }
      let x = opts.x;
      for (const piece of line) {
        const font = this.fontFor(piece.run);
        this.page.drawText(piece.text, { x, y: this.y - opts.size, size: opts.size, font, color: opts.color ?? TEXT });
        x += font.widthOfTextAtSize(piece.text, opts.size);
      }
      this.y -= lineHeight;
    });
  }

  block(block: Block) {
    if (block.kind === "space") {
      this.y -= block.size;
      return;
    }
    if (block.kind === "keep") {
      this.ensure(block.height);
      return;
    }
    if (block.kind === "rule") {
      this.ensure(16);
      this.y -= 8;
      this.page.drawLine({
        start: { x: MARGIN, y: this.y },
        end: { x: PAGE_W - MARGIN, y: this.y },
        thickness: 0.6,
        color: QUOTE_BAR,
      });
      this.y -= 8;
      return;
    }
    if (block.kind === "heading") {
      const size = block.level <= 2 ? 14 : 12;
      this.ensure(size * 3);
      this.y -= block.level <= 2 ? 12 : 8;
      this.drawRuns(block.runs.map((r) => ({ ...r, bold: true })), { size, x: MARGIN, width: CONTENT_W, color: BRAND });
      this.y -= 3;
      return;
    }

    const indent = (block.indent ?? 0) * 16 + (block.quote ? 12 : 0);
    const x = MARGIN + indent;
    const startY = this.y;
    const startPage = this.page;
    this.drawRuns(block.runs, { size: BODY_SIZE, x, width: CONTENT_W - indent, prefix: block.prefix });
    if (block.quote && this.page === startPage) {
      this.page.drawRectangle({ x: MARGIN, y: this.y + 2, width: 2.5, height: startY - this.y - 2, color: QUOTE_BAR });
    }
    this.y -= 3;
  }

  footer(label: string) {
    this.pages.forEach((page, idx) => {
      const text = this.sanitize(`${label}  •  ${idx + 1}/${this.pages.length}`);
      const width = this.fonts.regular.widthOfTextAtSize(text, 8);
      page.drawText(text, { x: (PAGE_W - width) / 2, y: MARGIN / 2, size: 8, font: this.fonts.regular, color: MUTED });
    });
  }
}

export async function renderLessonPdf(input: LessonPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(input.title);
  doc.setAuthor("Fluency Lab");

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
  };

  const writer = new Writer(doc, fonts);

  // Cabeçalho
  const HEADER_H = 96;
  writer.page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: BRAND });
  writer.page.drawText("FLUENCY LAB", { x: MARGIN, y: PAGE_H - 34, size: 9, font: fonts.bold, color: rgb(1, 1, 1) });
  writer.y = PAGE_H - 44;
  writer.drawRuns([{ text: input.title, bold: true }], { size: 20, x: MARGIN, width: CONTENT_W - 60, color: rgb(1, 1, 1) });
  writer.page.drawText(writer.sanitize(input.difficulty), {
    x: PAGE_W - MARGIN - fonts.bold.widthOfTextAtSize(input.difficulty, 14),
    y: PAGE_H - 36,
    size: 14,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  writer.y = PAGE_H - HEADER_H - 18;
  if (input.subtitle) {
    writer.drawRuns([{ text: input.subtitle, italic: true }], { size: 9.5, x: MARGIN, width: CONTENT_W, color: MUTED });
  }

  for (const block of collectBlocks(input.contentJson?.content)) writer.block(block);

  const { exercises, answers } = quizBlocks(input.quizData);
  if (exercises.length) {
    writer.block({ kind: "rule" });
    for (const block of exercises) writer.block(block);
    writer.addPage();
    for (const block of answers) writer.block(block);
  }

  writer.footer(`Fluency Lab  •  ${input.title}`);
  return doc.save();
}
