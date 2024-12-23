import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type React from "react";

import { IconPlus } from "@tabler/icons-react";

import NewSubscriptionModal from "@/components/demo-subscriptions/new-subscription-modal";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useNewDemoSubscriptionModal } from "@/features/demo-subscriptions/stores";

type DemoLayoutProps = {
	children: React.ReactNode;
	title?: string;
};

export default function DemoLayout({ children, title }: DemoLayoutProps) {
	const newModalState = useNewDemoSubscriptionModal();

	return (
		<>
			<Head>
				<title>{title}</title>
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/favicon-16x16.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
			</Head>
			<div className="border-b">
				<section className="ml-auto mr-auto max-w-[1200px]">
					<div className="flex h-16 items-center px-4">
						<Link href={"/"} className="cursor-pointer">
							<Image
								alt="SubTrack"
								width={265}
								height={30}
								src={"/subtrack_full.jpg"}
							/>
						</Link>
						<div className="ml-auto">
							<Button
								className="gap-2"
								onClick={() => {
									newModalState.set("open");
								}}
							>
								<IconPlus />
								Add Subscription
							</Button>
						</div>
					</div>
				</section>
			</div>
			<main className="ml-auto mr-auto max-w-[1200px] pb-8 px-6">
				{children}
				<Toaster />
				<NewSubscriptionModal />
			</main>
		</>
	);
}
