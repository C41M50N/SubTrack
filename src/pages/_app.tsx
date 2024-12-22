import { Analytics } from "@vercel/analytics/react";
import type { AppType } from "next/app";

import { api } from "@/utils/api";

import "@/styles/globals.css";
import Head from "next/head";

const MyApp: AppType = ({ Component, pageProps: { ...pageProps } }) => {
	const keywords = [
		"manage subscriptions",
		"subscription manager",
		"track digital subscriptions",
		"subscription management software",
		"subscription budgeting app",
		"subscription expense tracker",
		"subscription reminder app",
		"subscription billing tracker",
		"music streaming subscription manager",
		"entertainment subscription tracking",
		"software subscription management",
	];

	return (
		<>
			<Head>
				<title>SubTrack | A Subscriptions Tracking Dashboard</title>
				<meta name="description" content="A Subscriptions Tracking Dashboard" />
				<meta key="keywords" name="keywords" content={keywords.join(", ")} />
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
			<Component {...pageProps} />
			<Analytics />
		</>
	);
};

export default api.withTRPC(MyApp);
