import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { authClient } from "@/features/auth/auth-client";
import AuthLayout from "@/layouts/auth";
import { getServerAuthSession } from "@/server/api/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { GetServerSidePropsContext } from "next/types";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
	email: z.string().email(),
});

export default function ForgotPasswordPage() {
	const [loading, setLoading] = React.useState<boolean>(false);

	const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
		resolver: zodResolver(ForgotPasswordSchema),
		defaultValues: {
			email: "",
		},
	});

	async function onSubmit(values: z.infer<typeof ForgotPasswordSchema>) {
		await authClient.forgetPassword({
			email: values.email,
			redirectTo: "/auth/reset-password",
			fetchOptions: {
				onRequest: () => setLoading(true),
				onResponse: () => setLoading(false),
				onError(ctx) {
					toast({
						variant: "error",
						title: "Something went wrong",
						description: ctx.error.message,
					});
				},
			},
		});
	}

	return (
		<AuthLayout>
			<div className="w-[450px]">
				<Card className="w-full px-4 sm:px-6 pt-1 pb-4 shadow-none sm:shadow-xl border-none sm:border">
					<CardHeader>
						<div className="mx-auto pb-1">
							<Image
								alt="SubTrack"
								width={225}
								height={34}
								src={"/subtrack_full.jpg"}
							/>
						</div>
					</CardHeader>
					<CardContent>
						<div className="mx-auto pb-6 space-y-1">
							<h3 className="text-2xl text-center font-semibold">
								Forgot Password?
							</h3>
							<p className="text-sm text-center text-muted-foreground">
								No worries, we'll send you reset instructions.
							</p>
						</div>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-4"
							>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													placeholder="Enter your email"
													{...field}
													type="email"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button type="submit" isLoading={loading} className="w-full">
									Request password reset
								</Button>
							</form>
						</Form>
						<div className="pt-6">
							<Link href="/auth/login">
								<Button variant="ghost" className="w-full gap-2">
									<ArrowLeftIcon className="size-4" />
									Back to log in
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</AuthLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await getServerAuthSession(context.req);
	if (session) {
		return {
			redirect: {
				destination: "/dashboard"
			}
		}
	}

	return { props: {} }
}
