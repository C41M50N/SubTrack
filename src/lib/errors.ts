// Server functions only serialize an error's message to the client, so the
// class can't be checked there. Server handlers use this type to decide which
// messages are safe to show and replace everything else with a fallback.
export class UserFacingError extends Error {}

export async function withUserFacingErrors<T>(fallbackMessage: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof UserFacingError) {
      throw error;
    }

    console.error(error);
    throw new Error(fallbackMessage);
  }
}
