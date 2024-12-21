import type { NextApiRequest, NextApiResponse } from "next"
import { toNodeHandler } from "better-auth/node"
import { auth } from "@/server/auth";
 
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return await toNodeHandler(auth)(req, res)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
