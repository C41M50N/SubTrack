/**
 * Writes `fixtures/synthetic-statement.pdf`, a made-up card statement for smart
 * import demos and upload-flow testing. Every name and number is fictional.
 *
 * Usage: bun scripts/generate-synthetic-statement.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Transaction = [date: string, description: string, amount: string];

// Three months of charges with a mix of clear subscriptions, a price change,
// two plans at one merchant, a foreign charge, an ambiguous merchant, and
// everyday purchases the agent should skip.
const transactions: Transaction[] = [
  ['06/22', 'PAYMENT - THANK YOU', '-1,240.18'],
  ['06/23', 'NETFLIX.COM 866-579-7172 CA', '15.49'],
  ['06/24', 'WHOLEFDS MKT #10234 AUSTIN TX', '84.12'],
  ['06/25', 'SPOTIFY USA 877-778-1161 NY', '11.99'],
  ['06/27', 'PADDLE.NET* SETAPP 8007220 GB', '8.99'],
  ['06/28', 'APPLE.COM/BILL 866-712-7753 CA', '2.99'],
  ['07/01', 'GITHUB, INC. GITHUB.COM CA', '4.00'],
  ['07/01', 'GITHUB, INC. GITHUB.COM CA', '10.00'],
  ['07/02', 'SHELL OIL 57442 AUSTIN TX', '41.07'],
  ['07/03', 'ADOBE *CREATIVE CLD 408-536-6000 CA', '59.99'],
  ['07/05', 'SQ *CORNER COFFEE CLUB AUSTIN TX', '25.00'],
  ['07/08', 'CHIPOTLE 1932 AUSTIN TX', '13.45'],
  ['07/11', 'NOTION LABS EUR 10.00 @ 1.0930', '10.93'],
  ['07/14', 'STRAVA INC SAN FRANCISCO CA', '79.99'],
  ['07/18', 'TARGET T-2291 AUSTIN TX', '56.30'],
  ['07/22', 'PAYMENT - THANK YOU', '-402.77'],
  ['07/23', 'NETFLIX.COM 866-579-7172 CA', '15.49'],
  ['07/25', 'SPOTIFY USA 877-778-1161 NY', '11.99'],
  ['07/26', 'UBER *TRIP HELP.UBER.COM CA', '18.64'],
  ['07/27', 'PADDLE.NET* SETAPP 8007220 GB', '9.99'],
  ['07/28', 'APPLE.COM/BILL 866-712-7753 CA', '2.99'],
  ['08/01', 'GITHUB, INC. GITHUB.COM CA', '4.00'],
  ['08/01', 'GITHUB, INC. GITHUB.COM CA', '10.00'],
  ['08/03', 'ADOBE *CREATIVE CLD 408-536-6000 CA', '59.99'],
  ['08/05', 'SQ *CORNER COFFEE CLUB AUSTIN TX', '25.00'],
  ['08/09', 'WHOLEFDS MKT #10234 AUSTIN TX', '97.55'],
  ['08/11', 'NOTION LABS EUR 10.00 @ 1.0915', '10.92'],
  ['08/15', 'AMAZON PRIME*2K4LX9 AMZN.COM/BILL WA', '14.99'],
  ['08/22', 'PAYMENT - THANK YOU', '-388.20'],
  ['08/23', 'NETFLIX.COM 866-579-7172 CA', '15.49'],
  ['08/25', 'SPOTIFY USA 877-778-1161 NY', '11.99'],
  ['08/27', 'PADDLE.NET* SETAPP 8007220 GB', '9.99'],
  ['08/28', 'APPLE.COM/BILL 866-712-7753 CA', '2.99'],
  ['08/30', 'SHELL OIL 57442 AUSTIN TX', '38.81'],
  ['09/01', 'GITHUB, INC. GITHUB.COM CA', '4.00'],
  ['09/01', 'GITHUB, INC. GITHUB.COM CA', '10.00'],
  ['09/03', 'ADOBE *CREATIVE CLD 408-536-6000 CA', '59.99'],
  ['09/06', 'CHIPOTLE 1932 AUSTIN TX', '12.10'],
  ['09/11', 'NOTION LABS EUR 10.00 @ 1.0942', '10.94'],
  ['09/15', 'AMAZON PRIME*8H2QM1 AMZN.COM/BILL WA', '14.99'],
  ['09/17', 'TARGET T-2291 AUSTIN TX', '23.48'],
];

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const ROWS_PER_PAGE = 24;

function escapeText(text: string): string {
  return text.replace(/[\\()]/g, (character) => `\\${character}`);
}

function text(x: number, y: number, value: string, options: { bold?: boolean; size?: number } = {}): string {
  return `BT /${options.bold ? 'F2' : 'F1'} ${options.size ?? 9} Tf ${x} ${y} Td (${escapeText(value)}) Tj ET`;
}

// Helvetica digits are all 0.556 em wide, so amounts can be right-aligned.
function rightAlignedText(right: number, y: number, value: string, size = 9): string {
  return text(right - value.length * 0.556 * size, y, value, { size });
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function renderPage(rows: Transaction[], pageNumber: number, pageCount: number): string {
  const right = PAGE_WIDTH - MARGIN;
  const commands = [
    '0.6 w 0.75 G',
    text(MARGIN, 740, 'Northwind Bank', { bold: true, size: 16 }),
    text(MARGIN, 722, 'Everyday Rewards Visa  |  Account ending 0000'),
    text(MARGIN, 708, 'Statement period 06/21/2026 - 09/20/2026  |  Alex Sample (fictional)'),
    rightAlignedText(right, 740, `Page ${pageNumber} of ${pageCount}`),
    line(MARGIN, 694, right, 694),
    text(MARGIN, 676, 'Date', { bold: true }),
    text(MARGIN + 60, 676, 'Description', { bold: true }),
    text(right - 44, 676, 'Amount', { bold: true }),
    line(MARGIN, 668, right, 668),
  ];

  rows.forEach(([date, description, amount], index) => {
    const y = 652 - index * 22;

    commands.push(text(MARGIN, y, date), text(MARGIN + 60, y, description), rightAlignedText(right, y, amount));
    commands.push(line(MARGIN, y - 8, right, y - 8));
  });

  commands.push(
    text(MARGIN, 60, 'Synthetic statement for SubTrack demos. No real account, person, or transaction.', { size: 8 }),
  );

  return commands.join('\n');
}

function buildPdf(pages: string[]): Uint8Array {
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 5 + index * 2);

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  pages.forEach((content, index) => {
    const pageId = pageIds[index] ?? 0;

    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
    objects[pageId + 1] = `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;

  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

const pageRows: Transaction[][] = [];

for (let index = 0; index < transactions.length; index += ROWS_PER_PAGE) {
  pageRows.push(transactions.slice(index, index + ROWS_PER_PAGE));
}

const output = join(import.meta.dir, '..', 'fixtures', 'synthetic-statement.pdf');
writeFileSync(output, buildPdf(pageRows.map((rows, index) => renderPage(rows, index + 1, pageRows.length))));
console.log(`Wrote ${output}`);
