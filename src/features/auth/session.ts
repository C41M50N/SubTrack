import { createServerFn, createServerOnlyFn } from '@tanstack/react-start';

export const getRequestSession = createServerOnlyFn(async () => {
  const [{ getRequestHeaders }, { auth }] = await Promise.all([
    import('@tanstack/react-start/server'),
    import('./server'),
  ]);

  return auth.api.getSession({
    headers: getRequestHeaders(),
  });
});

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  return getRequestSession();
});

export const ensureSession = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await getRequestSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
});
