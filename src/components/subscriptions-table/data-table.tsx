import React from "react";

import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { selectedSubscriptionsAtom } from "@/features/common/atoms";
import type { Subscription } from "@/features/subscriptions";
import { useAtom } from "jotai";
import DataTableToolbar from "./data-table-toolbar";

interface DataTableProps {
	columns: ColumnDef<Subscription>[];
	data: Subscription[];
	categories: string[];
}

export default function DataTable({
	columns,
	data,
	categories,
}: DataTableProps) {
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		onStateChange: onTableChange,
		state: {
			sorting,
			rowSelection,
			columnVisibility,
			columnFilters,
		},
	});

	const [_, setSelectedSubscriptions] = useAtom(selectedSubscriptionsAtom);

	function onTableChange() {
		const selectedRows =
			table.getFilteredSelectedRowModel().rows.length > 0
				? table.getFilteredSelectedRowModel().rows
				: table.getFilteredRowModel().rows;

		const subscriptions = selectedRows.map((row) => row.original);
		setSelectedSubscriptions(subscriptions);
	}

	React.useEffect(() => {
		onTableChange();
	}, [rowSelection]);

	return (
		<div className="space-y-4">
			<DataTableToolbar table={table} categories={categories} />

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-gray-500"
								>
									You're not tracking any subscriptions yet.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>

				<div className="bg-primary-foreground text-muted-foreground text-md text-left py-2 px-4 w-full flex flex-row items-center">
					<span>
						{table.getFilteredSelectedRowModel().rows.length} of{" "}
						{table.getFilteredRowModel().rows.length} row(s) selected
					</span>
					<Button
						type="button"
						variant="outline"
						onClick={() => table.resetSorting()}
						className="ml-auto"
					>
						Clear Sorting
					</Button>
				</div>
			</div>
		</div>
	);
}
