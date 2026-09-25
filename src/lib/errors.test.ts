import { describe, expect, it, vi } from 'vitest';

import { UserFacingError, withUserFacingErrors } from '@/lib/errors';

describe('withUserFacingErrors', () => {
  it('passes through user-facing messages', async () => {
    await expect(
      withUserFacingErrors('Fallback', async () => {
        throw new UserFacingError('Next invoice date must be today or later');
      }),
    ).rejects.toThrow('Next invoice date must be today or later');
  });

  it('replaces unexpected errors with the fallback message', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      withUserFacingErrors('Fallback', async () => {
        throw new Error('column "next_invoice_date" is of type date but expression is of type text');
      }),
    ).rejects.toThrow(/^Fallback$/);
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });

  it('returns the result on success', async () => {
    await expect(withUserFacingErrors('Fallback', async () => 'ok')).resolves.toBe('ok');
  });
});
