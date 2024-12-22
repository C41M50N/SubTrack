import ConfirmDeleteAccountModal from "@/components/auth/confirm-delete-account-modal";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { authClient, useSession } from "@/features/auth/auth-client";
import { AccountDetailsSchema } from "@/features/users";
import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { useModalState } from "@/lib/hooks";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOutIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

export default function AccountSettingsPage() {
	const router = useRouter();
	const { data: session } = useSession();

	const form = useForm<z.infer<typeof AccountDetailsSchema>>({
		resolver: zodResolver(AccountDetailsSchema),
		defaultValues: {
			name: session?.user.name,
		},
	});

	const {
		mutate: updateAccountDetails,
		isLoading: isUpdateAccountDetailsLoading,
	} = api.users.updateAccountDetails.useMutation({
		onError(error) {
			toast({
				variant: "error",
				title: "Failed to update account details at this time",
				description: error.message,
			});
		},
		onSuccess() {
			toast({
				variant: "success",
				title: "Successfully updated account details",
			});
		},
	});

	const deleteAccountModalState = useModalState();

	const [isLogoutLoading, setIsLogoutLoading] = React.useState<boolean>(false);
	async function onLogOut() {
		await authClient.signOut({
			fetchOptions: {
				onRequest: () => setIsLogoutLoading(true),
				onResponse: () => setIsLogoutLoading(false),
				onError(ctx) {
					toast({
						variant: "error",
						title: "Something went wrong",
						description: ctx.error.message,
					});
				},
				onSuccess() {
					router.push("/");
				},
			},
		});
	}

	return (
		<MainLayout title="Account Settings | SubTrack">
			<SettingsLayout>
				<div className="space-y-6">
					<div>
						<h3 className="text-lg font-medium">Account Settings</h3>
						<p className="text-sm text-muted-foreground">
							Update your name and avatar. Perform account actions.
						</p>
					</div>
					<Separator className="my-6" />

					{/* Update name and image */}
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit((values) =>
								updateAccountDetails(values),
							)}
							className="space-y-1"
						>
							<Label className="text-base font-semibold">Account Details</Label>
							<div className="pt-2 flex flex-col space-y-4">
								<div className="flex flex-row gap-x-4">
									{/* Avatar image picker */}

									{/* Name */}
									<FormField
										name="name"
										control={form.control}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Name</FormLabel>
												<FormControl>
													<Input {...field} type="text" className="w-64" />
												</FormControl>
											</FormItem>
										)}
									/>

									{/* Email */}
									<div className="w-64 space-y-0.5">
										<Label>Email</Label>
										<Input
											type="email"
											value={session?.user.email}
											readOnly
											disabled
										/>
									</div>
								</div>
								<div>
									<Button
										type="submit"
										isLoading={isUpdateAccountDetailsLoading}
									>
										Save
									</Button>
								</div>
							</div>
						</form>
					</Form>

					<Separator className="my-6" />

					{/* Log out */}
					<div className="flex flex-col gap-y-1">
						<Label className="text-base font-semibold">Log out</Label>
						<div className="pt-1">
							<Button
								variant="destructive"
								className="gap-x-2"
								isLoading={isLogoutLoading}
								onClick={onLogOut}
							>
								<LogOutIcon className="size-4" />
								Log out
							</Button>
						</div>
					</div>

					<Separator className="my-6" />

					{/* Delete Account */}
					<div className="flex flex-col gap-y-1">
						<Label className="text-base font-semibold">Delete Account</Label>
						<div className="pt-1">
							<Button
								variant="destructive"
								className="gap-x-2"
								onClick={() => deleteAccountModalState.setState("open")}
							>
								<Trash2Icon className="size-4" />
								Delete Account
							</Button>
						</div>
					</div>
				</div>

				<ConfirmDeleteAccountModal state={deleteAccountModalState} />
			</SettingsLayout>
		</MainLayout>
	);
}
