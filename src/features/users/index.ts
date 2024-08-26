import { prisma } from "@/server/db";
import type {
	CreateUserProps,
	DeleteUserProps,
	UpdateUserProps,
} from "./types";

export async function createUser(data: CreateUserProps) {
	const user = await prisma.user.create({ data });

	// create default collection
	await prisma.collection.create({
		data: {
			title: "Personal",
			user_id: user.id,
		},
	});

	return user;
}

export async function updateUser(data: UpdateUserProps) {
	await prisma.user.update({
		where: { id: data.id },
		data: { name: data.name },
	});
}

export async function deleteUser(data: DeleteUserProps) {
	await prisma.user.delete({
		where: { id: data.id },
	});
}
