import { env } from "@/env.mjs";
import type { PurchasableLicense } from "@/features/pricing";
import { prisma } from "@/server/db";
import Stripe from "stripe";

type ProductId =
	| "prod_QdHlyETm3ryebm" // Basic License
	| "prod_QdHlZdRWC5JVWv"; // Pro License

const ProductMap: Record<ProductId, PurchasableLicense> = {
	prod_QdHlyETm3ryebm: "BASIC",
	prod_QdHlZdRWC5JVWv: "PRO",
};

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createPaymentSession(
	baseUrl: string,
	userId: string,
	email: string,
	licenseType: PurchasableLicense,
) {
	const session = await stripe.checkout.sessions.create({
		customer_email: email,
		mode: "payment",
		currency: "USD",
		line_items: [
			{
				price:
					licenseType === "BASIC"
						? "price_1Pm1C7Ii1eUsH1iyEDqx69MO"
						: "price_1Pm1CNIi1eUsH1iyXq3yYCCG",
				quantity: 1,
			},
		],
		success_url: `${baseUrl}/success?license_type=${licenseType}&session_id={CHECKOUT_SESSION_ID}`,
	});

	await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			currentStripeSession: session.id,
		},
	});

	return session.url;
}

export async function fulfillCheckout(session_id: string) {
	console.log(`fulfilling checkout session ${session_id}`);

	const session = await stripe.checkout.sessions.retrieve(session_id, {
		expand: ["line_items"],
	});
	const productId = session.line_items?.data.at(0)?.price?.product as
		| ProductId
		| undefined;
	if (!productId) {
		throw new Error("...");
	}

	const license = ProductMap[productId];
	const userId = (
		await prisma.user.findFirst({
			where: { currentStripeSession: session.id },
			select: { id: true },
		})
	)?.id;

	if (userId && session.payment_status === "paid") {
		switch (license) {
			case "BASIC":
				await prisma.user.update({
					where: {
						id: userId,
					},
					data: {
						licenseType: "BASIC",
					},
				});
				break;

			case "PRO":
				await prisma.user.update({
					where: {
						id: userId,
					},
					data: {
						licenseType: "PRO",
					},
				});
				break;
		}
	}
}

export async function constructWebhookEvent(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	requestBody: any,
	signature: string,
) {
	const event = stripe.webhooks.constructEvent(
		requestBody,
		signature,
		env.STRIPE_WEBHOOK_SECRET,
	);
	return event;
}

export async function isPaymentSessionSuccessful(session_id: string) {
	const session = await stripe.checkout.sessions.retrieve(session_id);
	return session.status === "complete" && session.payment_status === "paid";
}
