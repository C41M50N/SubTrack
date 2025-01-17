import FeatureCard from "@/components/common/feature-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/features/auth/auth-client";
import { IconDashboard, IconExternalLink } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
	const router = useRouter();
	const { data: session } = useSession();

	return (
		<>
			{/* Subtle Grid Backdrop */}
			<div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

			<div className="min-h-screen flex flex-col justify-between">
				<header className="h-24 mx-auto w-full max-w-[1440px] px-8 pt-1 2xl:px-0 flex flex-row items-center gap-2">
					<Link href={"/"} className="cursor-pointer">
						<Image
							alt="SubTrack"
							width={265}
							height={30}
							src={"/subtrack_full.jpg"}
						/>
					</Link>

					<div className="flex-1" />

					<div className="hidden md:flex flex-row gap-0.5">
						<Link href="/demo">
							<Button size="lg" variant="ghost_link">
								<span className="text-xl">Demo</span>
							</Button>
						</Link>

						<Link href="https://github.com/C41M50N/SubTrack">
							<Button
								size="lg"
								variant="ghost_link"
								className="flex flex-row gap-1"
							>
								<span className="text-xl">GitHub</span>
								<IconExternalLink className="size-5" />
							</Button>
						</Link>
					</div>

					<div className="ml-1" />

					<Separator
						orientation="vertical"
						className="hidden md:block h-2/5 bg-gray-400"
					/>

					<div className="ml-0" />

					{!session && (
						<div className="flex flex-row gap-2">
							<Link href="/auth/login">
								<Button size="lg" variant="ghost">
									<span className="font-semibold text-lg">Login</span>
								</Button>
							</Link>

							<Link href="/auth/signup">
								<Button size="lg" variant="default">
									<span className="font-semibold text-lg">Get Started</span>
								</Button>
							</Link>
						</div>
					)}

					{session && (
						<Button
							variant="default"
							size="lg"
							onClick={() => router.push("/dashboard")}
						>
							<IconDashboard className="mr-2" size={20} />
							<span className="font-semibold text-lg">Dashboard</span>
						</Button>
					)}
				</header>

				<section className="max-w-[720px] pt-14 md:pt-24 mx-auto flex flex-col items-center justify-center gap-9">
					<h1 className="text-4xl md:text-7xl font-bold text-center">
						Organize Your Digital Subscriptions
					</h1>
					<h2 className="text-lg md:text-2xl text-center text-black/50">
						SubTrack is the simplest way to track how much your digital
						subscriptions are costing you.
					</h2>
				</section>

				<section className="pt-12 md:pt-24 pb-14 mx-auto max-w-[1200px] mb-auto px-8 2xl:px-0">
					<div className="border-[5px] pb-1 px-[1px] border-black/70 rounded-xl">
						<Image
							className="mt-1"
							src={"/dashboard.jpeg"}
							width={3000}
							height={2000}
							quality={100}
							priority
							alt={"Dashboard Image"}
						/>
					</div>
				</section>

				<section className="pt-12 md:pt-24 pb-12 md:pb-24 mx-auto max-w-[1200px] mb-auto px-8 2xl:px-0">
					<div className="flex flex-col items-center">
						<h3 className="text-3xl md:text-4xl font-bold">Features</h3>

						<div className="mt-10 md:mt-14 2xl:w-[1350px] xl:w-[1150px] lg:w-full lg:px-2 grid lg:grid-cols-2 gap-x-14 gap-y-14 md:gap-y-20">
							<FeatureCard
								title="Manage Subscriptions"
								subtitle="Manage subscriptions via feature-rich dashboard table"
								image={
									<Image
										className="rounded-lg"
										width={500}
										height={350}
										quality={100}
										priority
										alt=""
										src="/assets/table.png"
									/>
								}
							/>

							<FeatureCard
								title="Gain Insights"
								subtitle="Gain insights on your subscriptions via cost metrics"
								image={
									<Image
										className="rounded-lg"
										width={350}
										height={200}
										quality={100}
										priority
										alt=""
										src="/assets/metrics.png"
									/>
								}
							/>

							<FeatureCard
								title="Categorize"
								subtitle="Organize subscriptions using custom categories"
								image={
									<Image
										className="rounded-lg"
										width={460}
										height={380}
										quality={100}
										priority
										alt=""
										src="/assets/categories.png"
									/>
								}
							/>

							<FeatureCard
								title="Stay Organized"
								subtitle="Separate subscriptions into various collections"
								image={
									<Image
										className="rounded-lg"
										width={380}
										height={200}
										quality={100}
										priority
										alt=""
										src="/assets/collections.png"
									/>
								}
							/>

							<FeatureCard
								title="Export Your Data"
								subtitle="Export your subscriptions to a CSV file"
								image={
									<Image
										className="rounded-lg"
										width={380}
										height={200}
										quality={100}
										priority
										alt=""
										src="/assets/export.png"
									/>
								}
							/>

							<FeatureCard
								title="Stay Informed"
								subtitle="Stay informed about your subscriptions with a monthly summary email"
								image={
									<Image
										className="rounded-lg"
										width={380}
										height={200}
										quality={100}
										priority
										alt=""
										src="/assets/email.png"
									/>
								}
							/>
						</div>
					</div>
				</section>

				<section className="pb-8 md:pb-24" />

				<footer className="bg-gray-50 h-16 flex">
					<div className="mx-auto my-auto">
						<span className="text-xs font-medium">
							Made by{" "}
							<Link
								href="https://www.linkedin.com/in/charles-buffington/"
								className="font-bold"
							>
								Charles Buffington
							</Link>
							. All rights reserved.
						</span>
					</div>
				</footer>
			</div>
		</>
	);
}
