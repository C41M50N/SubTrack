import { env } from "@/env.mjs";
import { createUser, deleteUser, updateUser } from "@/features/users";
import type { WebhookEvent } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import getRawBody from "raw-body";
import { Webhook } from "svix";

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
		res.status(405).end();
		return;
	}

	const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		throw new Error(
			"Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
		);
	}

	// Get the Svix headers for verification
	const svix_id = req.headers["svix-id"] as string;
	const svix_timestamp = req.headers["svix-timestamp"] as string;
	const svix_signature = req.headers["svix-signature"] as string;

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		res.status(400).json({ error: "Error occured -- no svix headers" });
		return;
	}

	const body = await getRawBody(req);

	// Create a new Svix instance with your secret.
	const wh = new Webhook(WEBHOOK_SECRET);

	let evt: WebhookEvent;

	// Attempt to verify the incoming webhook
	// If successful, the payload will be available from 'evt'
	// If the verification fails, error out and  return error code
	try {
		evt = wh.verify(body, {
			"svix-id": svix_id,
			"svix-timestamp": svix_timestamp,
			"svix-signature": svix_signature,
		}) as WebhookEvent;
	} catch (err) {
		console.error("Error verifying webhook:", err);
		res.status(400).json({ Error: err });
		return;
	}

	if (evt.type === "user.created") {
		console.log("creating user:", evt.data);
		await createUser({
			id: evt.data.id,
			name: `${evt.data.first_name} ${evt.data.last_name}`,
			email: evt.data.email_addresses.at(0)?.email_address as string,
			image: evt.data.image_url,
		});
	} else if (evt.type === "user.updated") {
		console.log("updating user:", evt.data);
		await updateUser({
			id: evt.data.id,
			name: `${evt.data.first_name} ${evt.data.last_name}`,
			image: evt.data.image_url,
		});
	} else if (evt.type === "user.deleted") {
		console.log("deleting user:", evt.data);
		await deleteUser({ id: evt.data.id as string });
	}

	res.status(200).end();
}
