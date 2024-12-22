import { auth } from "@/server/auth";
import { toNodeHandler } from "better-auth/node";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	return await toNodeHandler(auth)(req, res);
}

export const config = {
	api: {
		bodyParser: false,
	},
};
