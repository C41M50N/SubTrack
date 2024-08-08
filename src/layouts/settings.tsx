import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils";

type NavItem = {
	title: string;
	href: string;
};

const SettingsNavItems: Array<NavItem> = [
	{
		title: "Account",
		href: "/settings/account",
	},
	{
		title: "Categories",
		href: "/settings/categories",
	},
	{
		title: "Todoist Integration",
		href: "/settings/todoist",
	},
	// {
	//   title: "Todoist Debug",
	//   href: "/settings/todoist-debug"
	// },
	// {
	//   title: "Toast Debug",
	//   href: "/settings/toast-debug"
	// },
	// {
	//   title: "UI Debug",
	//   href: "/settings/ui-debug"
	// }
	// {
	//   title: "Notifications",
	//   href: "/settings/notifications"
	// }
];

type SettingsLayoutProps = {
	children: React.ReactNode;
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
	const pathname = usePathname();

	return (
		<div>
			<h1 className="text-2xl pt-4 pb-1">Settings</h1>
			<p className="text-muted-foreground">
				Manage your account settings and set notification preferences.
			</p>
			<Separator className="mt-4 mb-6" />
			<div className="flex flex-row space-x-12 space-y-2">
				<aside className="w-1/5">
					<nav className="flex flex-col space-y-1">
						{SettingsNavItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									buttonVariants({ variant: "ghost", size: "sm" }),
									pathname === item.href
										? "bg-muted hover:bg-muted"
										: "hover:bg-transparent hover:underline",
									"justify-start text-md border border-gray-500 border-opacity-30 rounded-sm",
								)}
							>
								{item.title}
							</Link>
						))}
					</nav>
				</aside>

				<div className="flex-1">{children}</div>
			</div>
		</div>
	);
}
