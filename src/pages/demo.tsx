import { columns as demoColumns } from "@/components/demo-subscriptions-table/columns";
import DemoDataTable from "@/components/demo-subscriptions-table/data-table";
import StatisticCard from "@/components/subscriptions/StatisticCard";
import {
	useDemoSubscriptions,
	useSelectedDemoSubscriptions,
} from "@/features/demo-subscriptions/stores";
import { Statistics } from "@/features/demo-subscriptions/subscription-stats";
import DemoLayout from "@/layouts/demo";
import { Separator } from "@radix-ui/react-select";
import dynamic from "next/dynamic";
import React from "react";

function DemoPage() {
	const { subscriptions } = useDemoSubscriptions();
	const { subscriptions: selectedSubscriptions } =
		useSelectedDemoSubscriptions();

	return (
		<DemoLayout title="Demo | SubTrack">
			<h1 className="text-2xl pt-4 pb-1">Dashboard</h1>
			<p className="text-muted-foreground">Track your subscriptions here.</p>
			<Separator className="mt-4 mb-6" />

			<div className="flex flex-row space-x-8">
				<div className="w-9/12">
					{!subscriptions && <span className="text-xl">No Subscriptions</span>}
					{subscriptions && (
						<DemoDataTable columns={demoColumns} data={subscriptions} />
					)}
				</div>

				<div className="flex-1">
					<div className="flex flex-col space-y-4">
						{subscriptions &&
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
					</div>
				</div>
			</div>
		</DemoLayout>
	);
}

export default dynamic(() => Promise.resolve(DemoPage), { ssr: false });
