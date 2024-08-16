import { createPaymentSession } from "@/lib/stripe";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const FormSchema = z.object({
	userId: z.string(),
	email: z.string().email(),
	licenseType: z.enum(["BASIC", "PRO"]),
});

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		res.status(405).end("Method Not Allowed");
	}

	const data = FormSchema.parse(req.body);
	const session_url = await createPaymentSession(
		req.headers.origin ?? "",
		data.userId,
		data.email,
		data.licenseType,
	);

	if (!session_url) {
		res.status(500).json("failed to create stripe session");
		return;
	}

	res.redirect(303, session_url);
}
