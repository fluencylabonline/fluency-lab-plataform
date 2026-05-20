import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, RGB } from "pdf-lib";

interface ReceiptData {
  id: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: string;
  description: string;
  studentName: string;
  studentEmail: string;
  guardianName: string;
  birthDate: string;
  payerDocument?: string;
  receiverDocument?: string;
  receiverName?: string;
}

interface NotebookData {
  title: string;
  studentName: string;
  content: string; // HTML
  date: Date | string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function maskDocument(doc?: string): string {
  if (!doc) return "—";
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 11) {
    return doc.replace(/(\d{3})\.\d{3}\.(\d{3})-\d{2}/, "$1.***.***-**");
  }
  return doc.replace(/(\d{2})\.\d.3\.\d{3}\/\d{4}-\d{2}/, "$1.***.***\/****-**");
}

function maskEmail(email?: string): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 2)}***@${domain}`;
}

function maskName(name?: string): string {
  if (!name) return "—";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val / 100);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Drawing primitives ─────────────────────────────────────────────────────

const GREEN: RGB = rgb(0.22, 0.69, 0.33);      // #38b053
const GRAY_DARK: RGB = rgb(0.18, 0.2, 0.22);
const GRAY_MID: RGB = rgb(0.45, 0.47, 0.50);
const GRAY_LIGHT: RGB = rgb(0.9, 0.92, 0.93);
const BLUE_BG: RGB = rgb(0.93, 0.96, 1.0);
const BLUE_TEXT: RGB = rgb(0.18, 0.42, 0.78);
const WHITE: RGB = rgb(1, 1, 1);

function drawSectionTitle(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont
) {
  page.drawText(text.toUpperCase(), {
    x,
    y,
    size: 7,
    font,
    color: GRAY_MID,
  });
}

function drawRow(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  pageWidth: number,
  font: PDFFont,
  boldFont: PDFFont
) {
  page.drawText(label, { x, y, size: 9, font, color: GRAY_MID });
  // Right-align value
  const valueWidth = boldFont.widthOfTextAtSize(value, 9);
  page.drawText(value, {
    x: pageWidth - x - valueWidth,
    y,
    size: 9,
    font: boldFont,
    color: GRAY_DARK,
  });
  // divider line
  page.drawLine({
    start: { x, y: y - 6 },
    end: { x: pageWidth - x, y: y - 6 },
    thickness: 0.5,
    color: GRAY_LIGHT,
  });
}

// ── Main export ────────────────────────────────────────────────────────────

export async function generateReceiptPDF(data: ReceiptData) {
  const pdfDoc = await PDFDocument.create();
  const PAGE_W = 420;
  const PAGE_H = 680;
  const MARGIN = 36;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  // Try to load Poppins from Google Fonts CDN
  let font: PDFFont;
  let boldFont: PDFFont;

  try {
    const regularFontUrl = "/fonts/Poppins-Regular.ttf";
    const boldFontUrl = "/fonts/Poppins-Bold.ttf";

    const [regularBytes, boldBytes] = await Promise.all([
      fetch(regularFontUrl).then(res => res.arrayBuffer()),
      fetch(boldFontUrl).then(res => res.arrayBuffer())
    ]);

    font = await pdfDoc.embedFont(regularBytes);
    boldFont = await pdfDoc.embedFont(boldBytes);
  } catch (error) {
    console.warn("Failed to load Poppins, falling back to Helvetica", error);
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  // ── Background ──────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: WHITE });

  // ── Green header block ──────────────────────────────────────────────────
  const HEADER_H = 160;
  // Use solid green as requested
  page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: GREEN });

  // Large "$" Watermark in background - centered and rotated slightly or just big
  page.drawText("$", {
    x: PAGE_W - 130,
    y: PAGE_H - 145,
    size: 160,
    font: boldFont,
    color: WHITE,
    opacity: 0.12,
  });

  // Header title
  page.drawText("Comprovante de", {
    x: MARGIN,
    y: PAGE_H - 95,
    size: 24,
    font: boldFont,
    color: WHITE,
  });
  page.drawText("transferência.", {
    x: MARGIN,
    y: PAGE_H - 128,
    size: 24,
    font: boldFont,
    color: WHITE,
  });

  // ── Body ─────────────────────────────────────────────────────────────────
  let curY = PAGE_H - HEADER_H - 30;

  const sectionGap = 20;
  const rowGap = 18;

  // Helper to draw a full section
  const drawSection = (title: string, rows: [string, string][]) => {
    drawSectionTitle(page, title, MARGIN, curY, boldFont);
    curY -= 14;
    rows.forEach(([label, value]) => {
      drawRow(page, label, value, MARGIN, curY, PAGE_W, font, boldFont);
      curY -= rowGap;
    });
    curY -= sectionGap;
  };

  // Divider helper
  const drawDivider = () => {
    page.drawLine({
      start: { x: MARGIN, y: curY },
      end: { x: PAGE_W - MARGIN, y: curY },
      thickness: 0.75,
      color: GRAY_LIGHT,
    });
    curY -= sectionGap;
  };

  // Dados do Pagador
  drawSection("Dados do Pagador", [
    ["Nome", maskName(data.guardianName || data.studentName)],
    ["CPF/CNPJ", maskDocument(data.payerDocument)],
  ]);

  // Dados do Recebedor
  drawSection("Dados do Recebedor", [
    ["Nome", data.receiverName ?? "Fluency Lab School"],
    ["CPF/CNPJ", maskDocument(data.receiverDocument)],
  ]);

  // Descrição
  drawSection("Descrição", [
    ["Forma de pagamento", data.paymentMethod],
    ["Aluno", maskName(data.studentName)],
    ["E-mail", maskEmail(data.studentEmail)],
    ["Data de pagamento", formatDate(data.paymentDate)],
    ["Descrição", data.description],
  ]);

  // ── Disclaimer box ───────────────────────────────────────────────────────
  const disclaimerText =
    "Este documento e cobrança não possuem valor fiscal e são de responsabilidade única e exclusiva da Fluency Lab School.";
  const BOX_H = 48;
  page.drawRectangle({
    x: MARGIN,
    y: curY - BOX_H,
    width: CONTENT_W,
    height: BOX_H,
    color: BLUE_BG,
  });

  const words = disclaimerText.split(" ");
  let line = "";
  let lineY = curY - 18;
  const maxW = CONTENT_W - 20;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, 7.5) > maxW) {
      page.drawText(line, { x: MARGIN + 10, y: lineY, size: 7.5, font, color: BLUE_TEXT });
      line = word;
      lineY -= 11;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x: MARGIN + 10, y: lineY, size: 7.5, font, color: BLUE_TEXT });
  }

  curY -= BOX_H + sectionGap;

  // ── Valor Pago ────────────────────────────────────────────────────────────
  page.drawText("VALOR PAGO", {
    x: MARGIN,
    y: curY,
    size: 10,
    font: boldFont,
    color: GRAY_DARK,
  });
  const amtText = formatCurrency(data.amount);
  const amtW = boldFont.widthOfTextAtSize(amtText, 20);
  page.drawText(amtText, {
    x: PAGE_W - MARGIN - amtW,
    y: curY - 2,
    size: 20,
    font: boldFont,
    color: GREEN,
  });
  curY -= 40;

  drawDivider();

  // ── Footer ────────────────────────────────────────────────────────────────
  page.drawText(`ID da transação: ${data.id}`, {
    x: MARGIN,
    y: curY,
    size: 7.5,
    font,
    color: GRAY_MID,
  });
  curY -= 12;
  page.drawText(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, {
    x: MARGIN,
    y: curY,
    size: 7.5,
    font,
    color: GRAY_MID,
  });

  // ── Save & Download ───────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  // Fixed Blob typing issue
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `comprovante-${data.id}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function generateNotebookPDF(data: NotebookData) {
  const pdfDoc = await PDFDocument.create();
  const PAGE_W = 595.28; // A4
  const PAGE_H = 841.89; // A4
  const MARGIN = 50;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  let font: PDFFont;
  let boldFont: PDFFont;

  try {
    const regularFontUrl = "/fonts/Poppins-Regular.ttf";
    const boldFontUrl = "/fonts/Poppins-Bold.ttf";

    const [regularBytes, boldBytes] = await Promise.all([
      fetch(regularFontUrl).then(res => res.arrayBuffer()),
      fetch(boldFontUrl).then(res => res.arrayBuffer())
    ]);

    font = await pdfDoc.embedFont(regularBytes);
    boldFont = await pdfDoc.embedFont(boldBytes);
  } catch {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  // ── Header ──────────────────────────────────────────────────────────────
  const HEADER_H = 120;
  page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: GREEN });

  page.drawText("Caderno de Aula", {
    x: MARGIN,
    y: PAGE_H - 60,
    size: 28,
    font: boldFont,
    color: WHITE,
  });

  page.drawText(`${data.studentName} • ${formatDate(data.date).split(",")[0]}`, {
    x: MARGIN,
    y: PAGE_H - 90,
    size: 10,
    font,
    color: WHITE,
    opacity: 0.8,
  });

  // ── Content ─────────────────────────────────────────────────────────────
  let curY = PAGE_H - HEADER_H - 40;

  page.drawText(data.title, {
    x: MARGIN,
    y: curY,
    size: 18,
    font: boldFont,
    color: GRAY_DARK,
  });
  curY -= 30;

  // Simple HTML stripping and line splitting
  const stripHtml = (html: string) => {
    if (typeof window === "undefined") return html.replace(/<[^>]*>?/gm, "");
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const text = stripHtml(data.content || "Sem conteúdo.");
  const lines = text.split("\n");

  for (const line of lines) {
    const words = line.trim().split(" ");
    if (words.length === 0 || (words.length === 1 && words[0] === "")) {
      curY -= 10;
      continue;
    }

    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, 11);

      if (width > CONTENT_W) {
        page.drawText(currentLine, { x: MARGIN, y: curY, size: 11, font, color: GRAY_DARK });
        curY -= 15;
        currentLine = word;

        if (curY < MARGIN + 40) {
          // Simplified page break - in a real app we'd add a new page here
          break;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, { x: MARGIN, y: curY, size: 11, font, color: GRAY_DARK });
      curY -= 20;
    }

    if (curY < MARGIN + 40) break;
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  const footerText = "Gerado por Fluency Lab School";
  const footerWidth = font.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: PAGE_W / 2 - footerWidth / 2,
    y: 30,
    size: 8,
    font,
    color: GRAY_MID,
  });

  // ── Save & Download ─────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `notebook-${data.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}