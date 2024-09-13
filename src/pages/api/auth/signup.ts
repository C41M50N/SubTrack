import { generateEmailVerificationCode, sendVerificationEmail, SignupSchema, type SignupProps } from '@/features/auth'
import { resend } from '@/lib/resend'
import { lucia } from '@/server/auth'
import { prisma } from '@/server/db'
import { generateIdFromEntropySize } from 'lucia'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  try {
    // Parse and validate the request body
    const data: SignupProps = SignupSchema.parse(JSON.parse(req.body))

    const userId = generateIdFromEntropySize(10); // 16 characters long

    await prisma.user.create({
      data: {
        id: userId,
        name: data.name,
        email: data.email,
        image: `https://source.boringavatars.com/marble/120/${encodeURIComponent(data.name)}`
      }
    })

    const code = await generateEmailVerificationCode(userId, data.email)
    await sendVerificationEmail(data.email, code);

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    res.status(302)
        .setHeader("Location", "/verify")
        .setHeader("Set-Cookie", sessionCookie.serialize());

  } catch (error) {
    if (error instanceof z.ZodError) {
      // If it's a Zod validation error, send back the error messages
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors 
      })
    }

    // For any other errors, log them and send a generic error message
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}