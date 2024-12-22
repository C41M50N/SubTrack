import { resend } from "@/lib/resend";
import dayjs from "dayjs";
import {
	MonthlyReviewEmail,
	type MonthlyReviewEmailProps,
} from "./monthly-review";
import {
	PasswordResetEmail,
	type PasswordResetEmailProps,
} from "./password-reset";
import { VerificationEmail, type VerificationEmailProps } from "./verification";

type SendReviewEmailProps = {
	to: string;
	emailProps: MonthlyReviewEmailProps;
};

export async function sendReviewEmail({
	to,
	emailProps,
}: SendReviewEmailProps) {
	await resend.sendEmail({
		to: to,
		from: "SubTrack Alerts <alert@subtrack.cbuff.dev>",
		subject: `Your Subscriptions Review for ${dayjs().format("MMMM")}`,
		react: MonthlyReviewEmail(emailProps),
	});
}

type SendPasswordResetEmail = {
	to: string;
	emailProps: PasswordResetEmailProps;
};

export async function sendPasswordResetEmail({
	to,
	emailProps,
}: SendPasswordResetEmail) {
	await resend.sendEmail({
		to: to,
		from: "SubTrack <no-reply@subtrack.cbuff.dev>",
		subject: "Reset your password",
		react: PasswordResetEmail(emailProps),
	});
}

type SendVerificationEmail = {
	to: string;
	emailProps: VerificationEmailProps;
};

export async function sendVerificationEmail({
	to,
	emailProps,
}: SendVerificationEmail) {
	await resend.sendEmail({
		to: to,
		from: "SubTrack <no-reply@subtrack.cbuff.dev>",
		subject: "Verify your email for SubTrack",
		react: VerificationEmail(emailProps),
	});
}
