import { redirect } from '@tanstack/react-router';

import { getSession } from './session';

const FALLBACK_REDIRECT = '/dashboard';

function sanitizeRedirect(redirectTo: string) {
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return FALLBACK_REDIRECT;
  }

  return redirectTo;
}

export async function requireSession(redirectTo: string) {
  const session = await getSession();

  if (!session) {
    const safeRedirect = sanitizeRedirect(redirectTo);
    throw redirect({
      to: '/login',
      search: { redirect: safeRedirect },
    });
  }

  return session;
}
