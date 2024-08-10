import { env } from "@/env.mjs";
import Stripe from "stripe";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function createPaymentSession(
	baseUrl: string,
	email: string,
	licenseType: "BASIC" | "PRO",
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
		success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
	});

	return session.url;
}
