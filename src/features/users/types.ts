import { z } from "zod";

const CreateUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email({ message: "invalid email" }),
	image: z.string().url({ message: "invalid image url" }),
});

export type CreateUserProps = z.infer<typeof CreateUserSchema>;

const UpdateUserSchema = CreateUserSchema.pick({ id: true, name: true, image: true });

export type UpdateUserProps = z.infer<typeof UpdateUserSchema>;

const DeleteUserSchema = CreateUserSchema.pick({ id: true });

export type DeleteUserProps = z.infer<typeof DeleteUserSchema>;

export const AccountDetailsSchema = z.object({
	name: z.string()
		.min(2, { message: "name must be at least 2 characters" })
		.max(100, { message: "name can be at most 100 characters" })
})
