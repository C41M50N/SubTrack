import { env } from "@/env.mjs";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
	secretKey: env.CLERK_SECRET_KEY,
});

export async function updateUserInfo(id: string, name: string) {
	let [firstName, lastName] = name.split(" ", 2);
	if (lastName === undefined) {
		lastName = "";
	}
	await clerkClient.users.updateUser(id, { firstName, lastName });
}

export async function deleteUser(id: string) {
	await clerkClient.users.deleteUser(id);
}
