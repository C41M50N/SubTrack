import { env } from "@/env.mjs";
import type { PurchasableLicense } from "@/features/pricing";
import { prisma } from "@/server/db";
import Stripe from "stripe";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function getProductMap() {
	const { data: products } = await stripe.products.list();
	const productMap: Record<string, PurchasableLicense> = {};
	for (const product of products) {
		console.log(product.metadata);
		productMap[product.id] = product.metadata.licenseType as PurchasableLicense;
	}
	console.log(productMap);
	return productMap;
}

export async function getPriceIdFromLicenseType(
	licenseType: PurchasableLicense,
) {
	const productMap = await getProductMap();
	let selectedProductId: string | undefined;
	for (const [_productId, _licenseType] of Object.entries(productMap)) {
		if (_licenseType === licenseType) {
			selectedProductId = _productId;
			break;
		}
	}

	if (!selectedProductId) throw new Error("missing product");

	const product = await stripe.products.retrieve(selectedProductId);
	return product.default_price as string;
}

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
				price: await getPriceIdFromLicenseType(licenseType),
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
		| string
		| undefined;
	if (!productId) {
		throw new Error("...");
	}

	const productMap = await getProductMap();

	const license = productMap[productId];
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
