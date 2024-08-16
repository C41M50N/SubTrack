import { constructWebhookEvent, fulfillCheckout } from "@/lib/stripe";
import type { NextApiRequest, NextApiResponse } from "next";
import getRawBody from "raw-body";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		res.status(405).end("Method Not Allowed");
	}

	const rawBody = await getRawBody(req);
	const stripe_signature = req.headers["stripe-signature"] as string;

	const event = await constructWebhookEvent(rawBody, stripe_signature);

	if (event.type === "checkout.session.completed") {
		await fulfillCheckout(event.data.object.id);
	}

	res.status(200).end();
}
