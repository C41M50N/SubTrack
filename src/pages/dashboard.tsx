import { LoadingSpinner } from "@/components/common/loading-spinner";
import { columns } from "@/components/subscriptions-table/columns";
import DataTable from "@/components/subscriptions-table/data-table";
import SkeletonStatisticCard from "@/components/subscriptions/skeleton-statistic-card";
import StatisticCard from "@/components/subscriptions/statistic-card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	selectedCollectionIdAtom,
	selectedSubscriptionsAtom,
} from "@/features/common/atoms";
import {
	getMonthCost,
	getNextNMonths,
} from "@/features/common/calculations-helpers";
import { Statistics } from "@/features/common/subscription-stats";
import MainLayout from "@/layouts/main";
import { useCategories, useUser } from "@/lib/hooks";
import { toMoneyString } from "@/utils";
import { api } from "@/utils/api";
import { useAtom } from "jotai";
import React from "react";

export default function DashboardPage() {
	const { user } = useUser();

	const [selectedCollectionId, setSelectedCollectionId] = useAtom(
		selectedCollectionIdAtom,
	);
	const { data: collections } = api.collections.getCollections.useQuery(
		undefined,
		{ staleTime: Number.POSITIVE_INFINITY },
	);

	React.useEffect(() => {
		if (collections && collections[0]) {
			setSelectedCollectionId(collections[0].id);
		}
	}, [collections]);

	const { data: subscriptions, isInitialLoading: isSubsLoading } =
		api.subscriptions.getSubscriptionsFromCollection.useQuery(
			selectedCollectionId || "",
			{ enabled: selectedCollectionId !== null },
		);
	const [selectedSubscriptions] = useAtom(selectedSubscriptionsAtom);
	const { categories, isCategoriesLoading } = useCategories();

	return (
		<MainLayout title="Dashboard | SubTrack">
			<h1 className="text-2xl pt-4 pb-1">Dashboard</h1>
			<p className="text-muted-foreground">Track your subscriptions here.</p>
			<Separator className="mt-4 mb-6" />

			<div className="flex flex-row space-x-6">
				<div className="w-full">
					{isSubsLoading && (
						<div className="w-full space-y-2 p-2">
							<Skeleton className="h-12" />
							<div className="py-2 space-y-3">
								{[...Array(7)].map((_, idx) => (
									<Skeleton className="h-8" key={idx} />
								))}
							</div>
							<Skeleton className="h-12" />
						</div>
					)}
					{!isSubsLoading && !subscriptions && (
						<div className="w-full flex flex-col gap-4 items-center justify-center">
							<LoadingSpinner />
							<span>Creating Your Dashboard</span>
						</div>
					)}
					{user &&
						!isSubsLoading &&
						subscriptions &&
						!isCategoriesLoading &&
						categories && (
							<DataTable
								columns={columns}
								data={subscriptions}
								categories={categories}
							/>
						)}
				</div>

				<div className="min-w-[245px]">
					<div className="flex flex-col space-y-4">
						{/* Statistic Cards */}
						{isSubsLoading &&
							Statistics.map((_, idx) => <SkeletonStatisticCard key={idx} />)}
						{!isSubsLoading &&
							subscriptions &&
							Statistics.map((item, idx) => (
								<StatisticCard
									key={idx}
									description={item.description}
									value={item.getResult(
										selectedSubscriptions.length > 0
											? selectedSubscriptions
											: subscriptions,
									)}
								/>
							))}

						{/* Monthly Cost Breakdown */}
						<Card>
							<Accordion
								type="single"
								collapsible
								defaultValue="monthly-cost-breakdown"
							>
								<AccordionItem value="monthly-cost-breakdown">
									<AccordionTrigger className="text-md font-semibold px-4 py-2">
										Monthly Cost Breakdown
									</AccordionTrigger>
									{isSubsLoading && (
										<AccordionContent>
											{[...Array(12)].map((_, idx) => (
												<div
													key={idx}
													className="w-full odd:bg-white even:bg-slate-50"
												>
													<Skeleton className="w-full" />
												</div>
											))}
										</AccordionContent>
									)}
									{!isSubsLoading && subscriptions && (
										<AccordionContent>
											{getNextNMonths(12).map((data) => {
												const [monthStr, month, year] = data;
												return (
													<div
														key={`${monthStr}-${year}`}
														className="w-full odd:bg-white even:bg-slate-50"
													>
														<div className="px-4 py-1.5 flex flex-row">
															<span className="flex-1">{`${monthStr} ${year}`}</span>
															<span>
																{toMoneyString(
																	getMonthCost(
																		selectedSubscriptions.length > 0
																			? selectedSubscriptions
																			: subscriptions,
																		month,
																		year,
																	),
																)}
															</span>
														</div>
													</div>
												);
											})}
										</AccordionContent>
									)}
								</AccordionItem>
							</Accordion>
						</Card>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
