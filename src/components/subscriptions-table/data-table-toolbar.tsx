import { IconCircleX, IconPlus } from "@tabler/icons-react";
import type { Table } from "@tanstack/react-table";
import CollectionSelector from "../collections/collection-selector";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DataTableFilter } from "./data-table-filter";
import { DataTableViewOptions } from "./data-table-view-options";
import MoreOptions from "./more-options";
import React from "react";
import { useNewSubscriptionModal } from "@/features/subscriptions/stores";

type Props<TData> = {
	table: Table<TData>;
	categories: string[];
};

export default function DataTableToolbar<TData>({
	table,
	categories,
}: Props<TData>) {
	const newSubscriptionModalState = useNewSubscriptionModal();
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex justify-between items-end">
			<div className="flex flex-1 space-x-2 items-end">
				<CollectionSelector />

				<div className="flex flex-row space-x-2">
					<Input
						placeholder="Filter subscriptions..."
						value={
							(table.getColumn("name")?.getFilterValue() as string) ?? ""
						}
						onChange={(event) =>
							table.getColumn("name")?.setFilterValue(event.target.value)
						}
						className="h-10 w-[200px] lg:w-[280px]"
					/>
					{table.getColumn("category") && (
						<DataTableFilter
							column={table.getColumn("category")}
							title={isFiltered ? "" : "Category"}
							options={categories.map((cat) => ({ label: cat, value: cat }))}
						/>
					)}

					{isFiltered && (
						<Button
							variant="ghost"
							onClick={() => table.resetColumnFilters()}
							className="h-10 px-2 lg:px-3"
						>
							Reset
							<IconCircleX className="ml-2 h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			<div className="flex flex-row space-x-2">
				<DataTableViewOptions table={table} />

				{/* Add Subscription Button */}
				<Button
					size="sm"
					className="h-10"
					onClick={() => newSubscriptionModalState.set("open")}
				>
					<IconPlus className="mr-2 size-4" />
					Add Subscription
				</Button>

				<MoreOptions />
			</div>
		</div>
	);
}
