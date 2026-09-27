import { createOpenAI } from '@ai-sdk/openai';
import { createAI } from '@cbuff/ai';
import { NoObjectGeneratedError, Output } from 'ai';
import { ENV } from 'varlock/env';

import type { SmartImportMediaType } from '@/features/imports/files';
import { SMART_IMPORT_MAX_ITEMS, smartImportOutputSchema } from '@/features/imports/smart-import/output';

export const SMART_IMPORT_MODEL_ID = 'gpt-6-sol';

/** The whole run, including web searches, must finish within this time. */
export const SMART_IMPORT_TIMEOUT_MS = 5 * 60 * 1000;

/** Caps OpenAI's built-in tool calls, which are all web searches here. */
const MAX_WEB_SEARCHES = 20;

/** USD per 1M tokens. Web search calls are billed separately and aren't included. */
const SMART_IMPORT_COSTS = { input: 2, output: 10 };

export const SMART_IMPORT_INSTRUCTIONS = `You find recurring subscriptions in bank statements, card statements, receipts, and screenshots. A person reviews everything you return before it is saved.

What counts:
- Recurring charges for a service, such as streaming, software, apps, cloud storage, news, memberships, and phone or internet plans.
- A single charge counts when the line or receipt clearly describes a subscription, such as an annual plan.
- Skip one-off purchases, transfers, card payments, ATM withdrawals, refunds, interest, and bank fees.

For each item:
- descriptor: the merchant text exactly as printed on the most recent charge, such as "PADDLE.NET* SETAPP".
- name: the service a person would recognize, such as "Setapp". Name the product, not the payment processor.
- domain: the service's main website domain in lowercase, without protocol or path, such as "setapp.com". Use null when you aren't sure.
- amountCents: the most recent charge in the currency's minor units, such as 1299 for 12.99. Never convert currencies.
- currency: the ISO 4217 code of the charge, such as "USD".
- frequency: weekly, monthly, yearly, or biennially. Read it from the spacing between charges or from text such as "annual". When you can't, give your best guess.
- lastChargeDate: the date of the most recent charge as YYYY-MM-DD. Statements often omit the year, so infer it from the statement period. A charge is never dated after today.
- category: an existing category name, spelled exactly as given. Propose a short new name only when none fits.
- reason: one short line explaining the item and your confidence, such as "Charged 3× monthly".

Merging:
- Merge repeated charges from the same merchant across all files into one item. Use the most recent charge's date and amount, and describe the pattern in the reason, such as "Charged 3× monthly".
- When the amount changed, note the change in the reason, such as "Charged 3× monthly. Price rose from $9.99 to $11.99".
- Keep separate items for different recurring amounts at the same merchant in the same period, such as two plans.

Confidence:
- Put an item in lowConfidence when its frequency is a guess, its charge isn't in USD, or you aren't sure who the merchant is.
- Put every other item in highConfidence.

Web search:
- Search only when a descriptor is ambiguous or the billing frequency can't be read from the files. Well-known merchants need no search.
- Search only with merchant names or descriptors. Never search with account numbers, card numbers, statement numbers, names of people, addresses, or amounts paired with personal details.

Return at most ${SMART_IMPORT_MAX_ITEMS} items in total. Return empty lists when the files contain no subscriptions.`;

export type SmartImportAgentFile = {
  mediaType: SmartImportMediaType;
  bytes: Uint8Array;
};

export function isSmartImportConfigured(): boolean {
  return Boolean(ENV.OPENAI_API_KEY);
}

function createSmartImportClient(apiKey: string) {
  const openai = createOpenAI({ apiKey });
  const ai = createAI({
    providers: { openai: () => openai },
    models: {
      smartImport: { provider: 'openai', id: SMART_IMPORT_MODEL_ID, costs: SMART_IMPORT_COSTS },
    },
  });

  return { ai, openai };
}

let client: ReturnType<typeof createSmartImportClient> | undefined;

function getClient() {
  const apiKey = ENV.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  client ??= createSmartImportClient(apiKey);

  return client;
}

function describeContext(input: { categories: string[]; today: string }): string {
  const categories =
    input.categories.length > 0
      ? `Existing categories: ${input.categories.map((name) => JSON.stringify(name)).join(', ')}.`
      : 'This collection has no categories yet.';

  return `Today is ${input.today}.\n${categories}\nFind the subscriptions in the attached files.`;
}

/**
 * Runs the smart import agent once. Web search runs inside the provider call,
 * so the run completes in a single step.
 */
export async function runSmartImportAgent(input: {
  files: SmartImportAgentFile[];
  categories: string[];
  today: string;
  abortSignal?: AbortSignal;
}) {
  const { ai, openai } = getClient();

  return ai.generate({
    model: 'smartImport',
    instructions: SMART_IMPORT_INSTRUCTIONS,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: describeContext(input) },
          // Generic file names keep personal details in real names off the request.
          ...input.files.map((file, index) => ({
            type: 'file' as const,
            data: file.bytes,
            mediaType: file.mediaType,
            filename: `file-${index + 1}.${file.mediaType.split('/')[1]}`,
          })),
        ],
      },
    ],
    output: Output.object({ schema: smartImportOutputSchema, name: 'subscriptions' }),
    reasoning: 'medium',
    tools: {
      web_search: openai.tools.webSearch({
        searchContextSize: 'low',
        userLocation: { type: 'approximate', country: 'US' },
      }),
    },
    providerOptions: {
      openai: { maxToolCalls: MAX_WEB_SEARCHES, store: false },
    },
    timeout: { totalMs: SMART_IMPORT_TIMEOUT_MS },
    abortSignal: input.abortSignal,
    // Logs only timing and cost.
    logKey: 'smart-import',
  });
}

/**
 * Token usage of a run that failed after the model responded, such as output
 * that didn't match the schema. Those tokens are still billed.
 */
export function getFailedRunUsage(
  error: unknown,
): { inputTokens: number; outputTokens: number; costUsd: number } | null {
  for (let current: unknown = error; current instanceof Error; current = current.cause) {
    if (NoObjectGeneratedError.isInstance(current) && current.usage) {
      const inputTokens = current.usage.inputTokens ?? 0;
      const outputTokens = current.usage.outputTokens ?? 0;
      const costUsd =
        (inputTokens / 1_000_000) * SMART_IMPORT_COSTS.input + (outputTokens / 1_000_000) * SMART_IMPORT_COSTS.output;

      return { inputTokens, outputTokens, costUsd };
    }
  }

  return null;
}
