import { LoadingSpinner } from "@/components/common/loading-spinner";
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
import { useUser } from "@/lib/hooks";
import { api } from "@/utils/api";
import { IconCircleCheck } from "@tabler/icons-react";

export default function LicenseSettingsPage() {
	const { user } = useUser();
	const { data } = api.main.getLicenseType.useQuery();

	return (
		<MainLayout title="License Settings | SubTrack">
			<SettingsLayout>
				{!data && <LoadingSpinner />}
				{user && data && (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-medium">Your License</h3>
							<p className="text-sm text-muted-foreground">
								You have the <strong>{data.license_type}</strong> license.
								{data.license_type !== "SUPER" && data.license_type !== "PRO"
									? "Upgrade to get even more features."
									: ""}
							</p>
						</div>
						<Separator />

						{(data.license_type === "FREE" ||
							data.license_type === "BASIC") && (
							<div className="flex flex-row gap-3">
								{data.license_type === "FREE" && (
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
											userId={user.id}
											userEmail={user.email as string}
											licenseType="BASIC"
										/>
									</>
								)}

								{data.license_type === "BASIC" && (
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
									userId={user.id}
									userEmail={user.email as string}
									licenseType="PRO"
								/>
							</div>
						)}

						{data.license_type === "PRO" && (
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

						{data.license_type === "SUPER" && (
							<div className="w-[350px] ml-4 px-8 py-8 flex flex-col border-8 border-double border-[#54617f] rounded-lg shadow-lg">
								<div className="mx-auto text-center">
									<h4 className="mx-auto text-xl text-[#363f53] font-bold">
										😎 {data.license_type} 😎
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
