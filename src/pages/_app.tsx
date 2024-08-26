import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import type { AppType } from "next/app";

import { api } from "@/utils/api";

import "@/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps: { ...pageProps } }) => {
	return (
		<ClerkProvider {...pageProps}>
			<Component {...pageProps} />
			<Analytics />
		</ClerkProvider>
	);
};

export default api.withTRPC(MyApp);
