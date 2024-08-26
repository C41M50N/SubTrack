"use client";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { selectedSubscriptionsAtom } from "@/features/common/atoms";
import dayjs from "@/lib/dayjs";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { useAtom } from "jotai";
import { CircleEllipsisIcon } from "lucide-react";

export default function MoreOptions() {
	const [subscriptions] = useAtom(selectedSubscriptionsAtom);

	function exportSubscriptionsToCSV() {
		const csvConfig = mkConfig({
			filename: `SubTrack Subscriptions - ${dayjs().format("YYYY-MM-DD")}`,
			useKeysAsHeaders: true,
		});

		const csv = generateCsv(csvConfig)(
			subscriptions
				.map(({ id, user_id, icon_ref, ...rest }) => rest)
				.map(({ next_invoice, last_invoice, ...rest }) => ({
					...rest,
					next_invoice: dayjs(next_invoice).format("MM/DD/YYYY"),
					last_invoice:
						last_invoice !== null
							? dayjs(last_invoice).format("MM/DD/YYYY")
							: "",
				})),
		);

		download(csvConfig)(csv);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="ml-auto hidden h-8 lg:flex"
				>
					<CircleEllipsisIcon className="mr-2 h-4 w-4" />
					More
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[150px]">
				<DropdownMenuLabel>Options</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={exportSubscriptionsToCSV}>
					Export to CSV
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
