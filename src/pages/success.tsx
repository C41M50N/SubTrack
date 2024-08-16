import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { PurchasableLicense } from "@/features/pricing";
import { isPaymentSessionSuccessful } from "@/lib/stripe";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";
import Image from "next/image";
import Link from "next/link";

export default function CheckoutSuccessPage({
	message,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<div className="flex h-screen">
			<div className="mx-auto my-auto">
				<Card className="w-[440px] shadow-xl border-2 border-gray-300">
					<CardContent className="py-6 flex flex-col items-center gap-1">
						<Image
							alt="SubTrack"
							width={200}
							height={30}
							src={"/subtrack_full.jpg"}
						/>
						<span className="text-sm font-medium">{message}</span>
						<CardFooter className="mt-3 p-0">
							<Button variant="link" className="w-full">
								<Link href="/dashboard">Return to Dashboard</Link>
							</Button>
						</CardFooter>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	if (!context.query.session_id || !context.query.license_type) {
		return { props: { message: "Something went wrong..." } };
	}

	const session_id = context.query.session_id as string;
	const license_type = context.query.license_type as PurchasableLicense;

	const res = await isPaymentSessionSuccessful(session_id);
	if (res) {
		return {
			props: {
				message: `Thank you so much for upgrading to the ${license_type} license!`,
			},
		};
	}

	return { props: { message: "Something went wrong..." } };
}
