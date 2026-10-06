/**
 * Runs the real smart import agent on local files and prints the grouped
 * review rows and the run's cost. Keep real statements in `fixtures/private/`,
 * which is gitignored.
 *
 * Usage:
 *   bun run import:eval                                  # every file in fixtures/private/
 *   bun run import:eval fixtures/synthetic-statement.pdf
 *   bun run import:eval --categories "Streaming,Software" statement.pdf
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

import { classifyFileSelection, detectSmartImportMediaType, SMART_IMPORT_MAX_PAGES } from '@/features/imports/files';
import { countPages } from '@/features/imports/pages';
import { groupReviewRows, reviewGroupLabels, createReviewState } from '@/features/imports/review';
import {
  isSmartImportConfigured,
  runSmartImportAgent,
  SMART_IMPORT_MODEL_ID,
  type SmartImportAgentFile,
} from '@/features/imports/smart-import/agent';
import { candidatesFromAgentOutput } from '@/features/imports/smart-import/candidates';
import { toDateKey } from '@/features/invoices/domain';
import { formatCurrencyFromCents, frequencyUnit } from '@/features/subscriptions/cost';

const PRIVATE_DIR = join(import.meta.dir, '..', 'fixtures', 'private');

function parseArgs(argv: string[]) {
  const paths: string[] = [];
  let categories: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? '';

    if (arg === '--categories') {
      categories = (argv[index + 1] ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      index += 1;
    } else {
      paths.push(arg);
    }
  }

  if (paths.length === 0 && existsSync(PRIVATE_DIR)) {
    for (const name of readdirSync(PRIVATE_DIR).sort()) {
      const path = join(PRIVATE_DIR, name);

      if (!name.startsWith('.') && statSync(path).isFile()) {
        paths.push(path);
      }
    }
  }

  return { paths, categories };
}

async function readFiles(paths: string[]): Promise<{ files: SmartImportAgentFile[]; pageCount: number }> {
  const selection = classifyFileSelection(
    paths.map((path) => ({ name: basename(path), size: statSync(path).size, type: '' })),
  );

  if (selection.path !== 'smart') {
    throw new Error(selection.path === 'invalid' ? selection.message : 'Pass PDFs or images, not an export file.');
  }

  const files: SmartImportAgentFile[] = [];
  let pageCount = 0;

  for (const path of paths) {
    const bytes = new Uint8Array(readFileSync(path));
    const mediaType = detectSmartImportMediaType(bytes);

    if (!mediaType) {
      throw new Error(`${basename(path)} isn’t a PDF, PNG, JPEG, or WebP file.`);
    }

    pageCount += await countPages({ name: basename(path), mediaType, bytes });
    files.push({ mediaType, bytes });
  }

  if (pageCount > SMART_IMPORT_MAX_PAGES) {
    throw new Error(`Files have ${pageCount} pages. The limit is ${SMART_IMPORT_MAX_PAGES}.`);
  }

  return { files, pageCount };
}

const { paths, categories } = parseArgs(process.argv.slice(2));

if (!isSmartImportConfigured()) {
  console.error('Set OPENAI_API_KEY in .env.local to run the agent.');
  process.exit(1);
}

if (paths.length === 0) {
  console.error(`No files. Pass file paths or add statements to ${PRIVATE_DIR}.`);
  process.exit(1);
}

const { files, pageCount } = await readFiles(paths);
const today = toDateKey(new Date());

console.log(`${files.length} files · ${pageCount} pages · ${SMART_IMPORT_MODEL_ID} · today ${today}\n`);

const { data, metadata } = await runSmartImportAgent({ files, categories, today });
const review = createReviewState(candidatesFromAgentOutput(data, { today, categories }), {
  subscriptions: [],
  categories,
});

for (const section of groupReviewRows(review.rows)) {
  console.log(`${reviewGroupLabels[section.group]} (${section.rows.length})`);

  for (const { draft, reason, descriptor, error } of section.rows) {
    const cost = draft.costAmount === null ? '—' : formatCurrencyFromCents(draft.costAmount);
    const unit = draft.costFrequency ? frequencyUnit(draft.costFrequency) : '';

    console.log(
      `  ${draft.name || '(no name)'}  ${cost}${unit}  next ${draft.nextInvoiceDate ?? '—'}  ` +
        `${draft.category ?? 'Uncategorized'}  ${draft.iconRef || '(no icon)'}`,
    );
    console.log(`    ${[error, reason, descriptor].filter(Boolean).join(' · ')}`);
  }

  console.log('');
}

const cost = metadata.totalCostUsd === undefined ? 'unknown' : `$${metadata.totalCostUsd.toFixed(4)}`;
console.log(
  `Cost ${cost} (${metadata.inputTokens.toLocaleString()} in, ${metadata.outputTokens.toLocaleString()} out) · ` +
    `${(metadata.responseTimeMs / 1000).toFixed(1)}s. Web search fees aren’t included.`,
);
