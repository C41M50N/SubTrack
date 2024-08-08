import { zodResolver } from "@hookform/resolvers/zod";
import { signOut, useSession } from "next-auth/react";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";

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
import { Separator } from "@/components/ui/separator";
import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { useUserName } from "@/lib/hooks";

const AccountFormSchema = z.object({
	name: z.string(),
});

export default function AccountSettingsPage() {
	const { data: session, update: refreshSessionData } = useSession();
	const form = useForm<z.infer<typeof AccountFormSchema>>({
		resolver: zodResolver(AccountFormSchema),
		defaultValues: { name: session?.user.name || "" },
	});

	const { setUserName, isSetUserNameLoading } = useUserName();

	function onSubmit(values: z.infer<typeof AccountFormSchema>) {
		if (values.name !== session?.user.name) {
			setUserName(values.name);
			refreshSessionData({ name: values.name });
		}
	}

	React.useEffect(() => {
		if (session) {
			form.setValue("name", session.user.name || "");
		}
	}, [session]);

	return (
		<MainLayout title="Account Settings | SubTrack">
			<SettingsLayout>
				<div className="space-y-6">
					<div>
						<h3 className="text-lg font-medium">Account</h3>
						<p className="text-sm text-muted-foreground">
							View your account information. Update your account settings.
						</p>
					</div>
					<Separator />

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<div className="grid grid-cols-3 gap-3">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-base">Name</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormItem>
									<FormLabel className="text-base">Email</FormLabel>
									<FormControl>
										<Input disabled value={session?.user.email ?? ""} />
									</FormControl>
								</FormItem>
							</div>

							<Button
								type="submit"
								isLoading={isSetUserNameLoading}
								className="gap-1 "
							>
								<span>Save</span>
							</Button>
						</form>
					</Form>

					<div className="pt-4 space-y-2">
						<h3 className="text-base font-medium">Sign Out of Account</h3>
						<Button
							variant="destructive"
							onClick={() => signOut({ callbackUrl: "/", redirect: true })}
						>
							Sign Out
						</Button>
					</div>
				</div>
			</SettingsLayout>
		</MainLayout>
	);
}
