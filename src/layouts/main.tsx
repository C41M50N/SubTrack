import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type React from "react";

import {
	IconDashboard,
	IconEdit,
	IconPlus,
	IconSettings,
	IconSettingsFilled,
} from "@tabler/icons-react";

import NewSubscriptionModal from "@/components/subscriptions/NewSubscriptionModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/toaster";
import {
	useCategories,
	useCollections,
	useUser,
} from "@/lib/hooks";
import { UserButton, useClerk } from "@clerk/nextjs";

type MainLayoutProps = {
	children: React.ReactNode;
	title?: string;
};

export default function MainLayout({ children, title }: MainLayoutProps) {
	const { user } = useUser();
	const { signOut } = useClerk();

	const { categories } = useCategories();
	const { collections } = useCollections();

	return (
		<>
			<Head>
				<title>{title}</title>
			</Head>
			<div className="border-b">
				<section className="ml-auto mr-auto max-w-[1400px]">
					<div className="flex h-16 items-center px-4">
						<Link href={"/"} className="cursor-pointer">
							<Image
								alt="SubTrack"
								width={200}
								height={30}
								src={"/subtrack_full.jpg"}
							/>
						</Link>
						<nav className="flex items-center space-x-4 mx-6 pl-4 lg:space-x-6">
							<Link
								href={"/dashboard"}
								className="text-md font-medium text-muted-foreground transition-colors rounded-md p-2 px-2 flex flex-row gap-1 hover:text-primary"
							>
								<IconDashboard />
								Dashboard
							</Link>
							<Link
								href={"/settings/categories"}
								className="text-md font-medium text-muted-foreground transition-colors rounded-md p-2 px-2 flex flex-row gap-1 hover:text-primary"
							>
								<IconSettings />
								Settings
							</Link>
						</nav>

						<div className="ml-auto" />

						{user && (
							// <UserButton>
							// 	<UserButton.MenuItems>
							// 		<UserButton.Link
							// 			label="Settings"
							// 			labelIcon={<IconSettingsFilled className="size-4" />}
							// 			href="/settings/account"
							// 		/>
							// 		<UserButton.Action label="signOut" />
							// 	</UserButton.MenuItems>
							// </UserButton>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="relative h-8 w-8 rounded-full"
									>
										<Avatar>
											<AvatarImage
												alt={user.name}
												src={
													user.image ||
													"https://img.icons8.com/cotton/64/gender-neutral-user--v1.png"
												}
											/>
											<AvatarFallback>||</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-56"
									align="end"
									sideOffset={10}
									forceMount
								>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-medium leading-none">
												{user.name}
											</p>
											<p className="text-xs leading-none text-muted-foreground">
												{user.email}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<Link href={"/settings/account"}>
										<DropdownMenuItem>Settings</DropdownMenuItem>
									</Link>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-red-700"
										onClick={() =>
											signOut({ redirectUrl: "/" })
										}
									>
										Log out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
				</section>
			</div>
			<main className="ml-auto mr-auto max-w-[1400px] pb-8 px-6">
				{children}
				<Toaster />
				<NewSubscriptionModal
					categories={categories || []}
					collections={collections || []}
				/>
			</main>
		</>
	);
}
