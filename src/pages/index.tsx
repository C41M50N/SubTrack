import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { pricingInfo } from "@/features/pricing";
import { authOptions } from "@/server/auth";
import {
	IconArrowBadgeRight,
	IconArrowBadgeRightFilled,
	IconArrowBigRightFilled,
	IconCircleCheck,
	IconExternalLink,
} from "@tabler/icons-react";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";
import { getServerSession } from "next-auth/next";
import { getProviders, signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage({
	provider,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const { data: session } = useSession();
	const router = useRouter();

	return (
		<>
			<Head>
				<title>SubTrack | A Subscriptions Tracking Dashboard</title>
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

					<div className="flex flex-row gap-0.5">
						<a href="https://cbuff.dev/projects/subtrack">
							<Button variant="link" className="flex flex-row gap-1">
								<span className="text-2xl">About</span>
								<IconExternalLink strokeWidth={1.5} />
							</Button>
						</a>

						<span className="text-lg font-bold self-center">·</span>

						<a href="/demo">
							<Button variant="link" className="flex flex-row gap-1">
								<span className="text-2xl">Demo</span>
								<IconExternalLink strokeWidth={1.5} />
							</Button>
						</a>

						<span className="text-lg font-bold self-center">·</span>

						<a href="https://github.com/C41M50N/SubTrack">
							<Button variant="link" className="flex flex-row gap-1">
								<span className="text-2xl">GitHub</span>
								<IconExternalLink strokeWidth={1.5} />
							</Button>
						</a>
					</div>

					<Separator orientation="vertical" className="h-2/5 bg-gray-500" />

					<div className="ml-5" />

					{session === null && (
						<Button
							className="bg-black hover:bg-black/80 flex flex-row gap-4"
							variant="default"
							size="lg"
							onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
						>
							<Image
								alt="Google Icon"
								src="/google.svg"
								width={1}
								height={1}
								className="w-6 h-6"
							/>
							<span className="font-semibold text-lg">Sign In with Google</span>
						</Button>
					)}
					{session !== null && (
						<Button
							variant="default"
							size="lg"
							onClick={() => router.push("/dashboard")}
						>
							<span className="font-semibold text-lg">Go to Dashboard</span>
							<IconArrowBigRightFilled className="ml-3" size={20} />
						</Button>
					)}
				</header>

				<section className="pt-24 mx-auto flex flex-col items-center justify-center gap-9 w-[720px]">
					<h1 className="text-7xl font-bold text-center">
						Organize Your Digital Subscriptions
					</h1>
					<h2 className="text-2xl text-center text-black/50">
						SubTrack is the simplest way to track how much your digital
						subscriptions are costing you.
					</h2>
				</section>

				<section className="pt-24 pb-14 mx-auto max-w-[1200px] mb-auto px-8 2xl:px-0">
					<div className="border-[5px] pb-1 px-[1px] border-black/70 rounded-xl">
						<Image
							className="mt-1"
							src={"/dashboard.png"}
							width={3000}
							height={2000}
							alt={"Dashboard Image"}
						/>
					</div>
				</section>

				<section className="pt-24 pb-24 mx-auto max-w-[1200px] mb-auto px-8 2xl:px-0">
					<div className="mx-auto flex flex-col items-center">
						<h3 className="text-4xl font-bold">
							Pricing
						</h3>

						<div className="mt-12 grid grid-cols-3 gap-8">
							{pricingInfo.map((info) => (
								<div key={info.title} className="min-w-[200px] px-6 py-6 flex flex-col border-2 border-gray-200 rounded-lg shadow-lg">
									<div className="mx-auto text-center">
										<h4 className="mx-auto text-xl font-bold">
											{info.title}
										</h4>

										<div className="h-6" />

										<h3 className="text-5xl font-bold tabular-nums">
											${info.cost}
										</h3>

										<div className="h-2" />

										<span className="text-muted-foreground">
											{info.subtitle}
										</span>
									</div>

									<div className="mt-8 flex flex-col gap-1">
										{info.features.map((feature) => (
											<div key={feature} className="flex flex-row gap-2 items-center text-sm">
												<IconCircleCheck className="text-[#54617f]" />
												<span className="leading-none text-muted-foreground">{feature}</span>
											</div>
										))}
									</div>

									<Button
										className="mt-8"
										onClick={() => router.push('/')}
									>
										Get Started
									</Button>
								</div>
							))}
						</div>
					</div>
				</section>

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

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const providers = await getProviders();

	return {
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		props: { provider: providers!.google },
	};
}
