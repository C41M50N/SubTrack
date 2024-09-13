import { lucia } from '@/server/auth'
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const sessionId = req.cookies[lucia.sessionCookieName] ?? "";
  const { user } = await lucia.validateSession(sessionId);
	if (!user) {
    res.status(401).end();
	}

  
}
