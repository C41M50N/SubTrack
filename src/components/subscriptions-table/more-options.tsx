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
import type { Table } from "@tanstack/react-table";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { useAtom } from "jotai";
import { EllipsisVerticalIcon, ImportIcon, Settings2Icon, SettingsIcon } from "lucide-react";
import React from "react";
import { Switch } from "../ui/switch";
import type { Subscription } from "@/features/subscriptions";

type MoreOptionsProps = {
	table: Table<Subscription>;
};

export default function MoreOptions(props: MoreOptionsProps) {
	const [tableSize, setTableSize] = React.useState<"default" | "compact">("default");

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
				<Button variant="outline" className="p-0 h-10 w-8">
					<Settings2Icon className="size-5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[150px]">
				<DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
				{props.table
					.getAllColumns()
					.filter(
						(column) =>
							typeof column.accessorFn !== "undefined" && column.getCanHide(),
					)
					.map((column) => {
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className="capitalize"
								onSelect={(e) => e.preventDefault()}
								checked={column.getIsVisible()}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{column.id.replaceAll("_", " ")}
							</DropdownMenuCheckboxItem>
						);
					})
				}

				<DropdownMenuSeparator />

				<DropdownMenuLabel>Table Size</DropdownMenuLabel>
				<DropdownMenuItem
					onSelect={(e) => e.preventDefault()}
					onClick={() => setTableSize(tableSize === "compact" ? "default" : "compact")}
				>
					<div className="pl-1 flex flex-row gap-4 items-center">
						<Switch size="sm" checked={tableSize === "compact"} />
						<span>
							{tableSize === "default" ? "Default" : "Compact"}
						</span>
					</div>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuLabel>Options</DropdownMenuLabel>
				<DropdownMenuItem onClick={() => {}}>
					<ImportIcon className="mr-2.5 size-4" />
					<span>
						Import Data
					</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={exportSubscriptionsToCSV}>
					<ImportIcon className="mr-2.5 size-4 rotate-180" />
					<span>
						Export Data
					</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
