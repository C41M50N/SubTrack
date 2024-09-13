import { z } from "zod"

export const SignupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
})

export type SignupProps = z.infer<typeof SignupSchema>


import { TimeSpan, createDate } from "oslo";
import { generateRandomString, alphabet } from "oslo/crypto";
import { prisma } from "@/server/db";
import { resend } from "@/lib/resend";
import { VerificationEmail } from "@/emails/verification";

export async function generateEmailVerificationCode(userId: string, email: string): Promise<string> {
  await prisma.emailVerificationCode.deleteMany({
    where: {
      userId: userId
    }
  })

	const code = generateRandomString(8, alphabet("0-9"));
  await prisma.emailVerificationCode.create({
    data: {
      userId,
      email,
      code,
      expiresAt: createDate(new TimeSpan(10, "m")) // 10 minutes
    }
  })

	return code;
}

export async function sendVerificationEmail(email: string, code: string) {
  await resend.sendEmail({
    from: "notifications@subtrack.cbuff.dev",
    to: email,
    subject: `${code} is your verification code`,
    react: VerificationEmail({ code })
  })
}
