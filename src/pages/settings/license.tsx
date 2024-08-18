import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	BASIC_PRICING_INFO,
	FREE_PRICING_INFO,
	PRO_PRICING_INFO,
	SUPER_FEATURES,
} from "@/features/pricing";
import PricingCard from "@/features/pricing/pricing-card";
import MainLayout from "@/layouts/main";
import SettingsLayout from "@/layouts/settings";
import { api } from "@/utils/api";
import { IconCircleCheck } from "@tabler/icons-react";
import { useSession } from "next-auth/react";

export default function LicenseSettingsPage() {
	const { data: session } = useSession();
	const { data } = api.main.getLicenseType.useQuery();

	return (
		<MainLayout title="License Settings | SubTrack">
			<SettingsLayout>
				{!data && <LoadingSpinner />}
				{session && data && (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-medium">Your License</h3>
							<p className="text-sm text-muted-foreground">
								You have the <strong>{data.licenseType}</strong> license.
								{data.licenseType !== "SUPER" && data.licenseType !== "PRO"
									? "Upgrade to get even more features."
									: ""}
							</p>
						</div>
						<Separator />

						{(data.licenseType === "FREE" || data.licenseType === "BASIC") && (
							<div className="flex flex-row gap-3">
								{data.licenseType === "FREE" && (
									<>
										<PricingCard
											title={FREE_PRICING_INFO.title}
											subtitle={FREE_PRICING_INFO.subtitle}
											cost={FREE_PRICING_INFO.cost}
											features={FREE_PRICING_INFO.features}
											actionLabel="Your License"
											actionType="none"
										/>

										<PricingCard
											title={BASIC_PRICING_INFO.title}
											subtitle={BASIC_PRICING_INFO.subtitle}
											cost={BASIC_PRICING_INFO.cost}
											features={BASIC_PRICING_INFO.features}
											actionLabel="Upgrade to Basic"
											actionType="submit-checkout-form"
											userId={session.user.id}
											userEmail={session.user.email as string}
											licenseType="BASIC"
										/>
									</>
								)}

								{data.licenseType === "BASIC" && (
									<PricingCard
										title={BASIC_PRICING_INFO.title}
										subtitle={BASIC_PRICING_INFO.subtitle}
										cost={BASIC_PRICING_INFO.cost}
										features={BASIC_PRICING_INFO.features}
										actionLabel="Your License"
										actionType="none"
									/>
								)}

								<PricingCard
									title={PRO_PRICING_INFO.title}
									subtitle={PRO_PRICING_INFO.subtitle}
									cost={PRO_PRICING_INFO.cost}
									features={PRO_PRICING_INFO.features}
									actionLabel="Upgrade to Pro"
									actionType="submit-checkout-form"
									userId={session.user.id}
									userEmail={session.user.email as string}
									licenseType="PRO"
								/>
							</div>
						)}

						{data.licenseType === "PRO" && (
							<div className="max-w-sm">
								<PricingCard
									title={PRO_PRICING_INFO.title}
									subtitle={PRO_PRICING_INFO.subtitle}
									cost={PRO_PRICING_INFO.cost}
									features={PRO_PRICING_INFO.features}
									actionLabel="Your License"
									actionType="none"
								/>
							</div>
						)}

						{data.licenseType === "SUPER" && (
							<div className="w-[350px] ml-4 px-8 py-8 flex flex-col border-8 border-double border-[#54617f] rounded-lg shadow-lg">
								<div className="mx-auto text-center">
									<h4 className="mx-auto text-xl text-[#363f53] font-bold">
										😎 {data.licenseType} 😎
									</h4>
								</div>

								<div className="mt-6 flex flex-col gap-1.5">
									{SUPER_FEATURES.map((feature) => (
										<div
											key={feature}
											className="flex flex-row gap-2 items-center text-sm"
										>
											<IconCircleCheck className="text-[#54617f] size-5" />
											<span className="leading-none text-muted-foreground">
												{feature}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</SettingsLayout>
		</MainLayout>
	);
}
