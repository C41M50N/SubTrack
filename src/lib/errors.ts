// Server functions only serialize an error's message to the client, so the
// class can't be checked there. Server handlers use this type to decide which
// messages are safe to show and replace everything else with a fallback.
export class UserFacingError extends Error {}

/** The error's type and code, without a message that could carry data. */
export function describeErrorSafely(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unknown error';
  }

  const code = 'code' in error && typeof error.code === 'string' ? ` (${error.code})` : '';

  return `${error.name}${code}`;
}

export async function withUserFacingErrors<T>(
  fallbackMessage: string,
  run: () => Promise<T>,
  // Database errors can quote row values, such as a webhook URL or secret.
  // Handlers touching secrets log only the error's type.
  options: { logDetails?: boolean } = {},
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof UserFacingError) {
      throw error;
    }

    console.error(options.logDetails === false ? describeErrorSafely(error) : error);
    throw new Error(fallbackMessage);
  }
}
