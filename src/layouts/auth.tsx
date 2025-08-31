import { Toaster } from "@/components/ui/toaster";
import Head from "next/head";

type AuthLayoutProps = {
	children: React.ReactNode;
	title?: string;
};

export default function AuthLayout({ children, title }: AuthLayoutProps) {
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
			<div className="h-screen sm:-mt-10 flex justify-center items-center">
				{children}
				<Toaster />
			</div>
		</>
	);
}
