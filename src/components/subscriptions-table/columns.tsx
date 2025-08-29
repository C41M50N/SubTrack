import { Lato, Roboto } from "next/font/google";
import Image from "next/image";

import dayjs from "@/lib/dayjs";
import {
	IconAlarm,
	IconDotsVertical,
	IconPencil,
	IconTrash,
} from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { Subscription } from "@/features/subscriptions";
import {
	useCategories,
	useCollections,
	useModalState,
	useTableSortState,
	useUser,
} from "@/lib/hooks";
import { toMoneyString, toProperCase } from "@/utils";

import DeleteSubscriptionModal from "@/components/subscriptions/delete-subscription-modal";
import EditSubscriptionModal from "@/components/subscriptions/edit-subscription-modal";
import SetCancelReminderModal from "@/components/subscriptions/set-cancel-reminder-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";

const roboto = Roboto({
	weight: ["400", "500", "700"],
	style: ["normal"],
	subsets: ["latin"],
});

const lato = Lato({
	weight: ["400", "700"],
	style: ["normal"],
	subsets: ["latin"],
});

export const columns: ColumnDef<Subscription>[] = [
	{
		id: "id",
		accessorKey: "id",
		filterFn: (row, id, value: string[]) => {
			return value.includes(row.getValue(id));
		}
	},
	{
		id: "select",
		header: ({ table }) => {
			return (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => {
						table.toggleAllPageRowsSelected(!!value);
					}}
					aria-label="Select all"
				/>
			);
		},
		cell: ({ row }) => {
			return (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => {
						row.toggleSelected(!!value);
					}}
					aria-label="Select row"
				/>
			);
		},
		enableSorting: true,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: ({ column }) => {
			const { toggleSorting, SortIcon } = useTableSortState(column);
			return (
				<Button
					variant="ghost"
					className="-ml-4"
					onClick={toggleSorting}
				>
					Name
					{SortIcon && <SortIcon className="ml-2 h-4 w-4" />}
				</Button>
			);
		},
		cell: ({ row }) => {
			const icon_ref = row.original.icon_ref;
			return (
				<div className="flex flex-row space-x-3 items-center">
					{icon_ref.includes(".") ? (
						<Image
							alt={toProperCase(icon_ref)}
							src={`/${icon_ref}`}
							height={24}
							width={24}
							className="w-[24px] h-[24px]"
						/>
					) : (
						<Image
							alt={toProperCase(icon_ref)}
							src={`/${icon_ref}.svg`}
							height={24}
							width={24}
							className="w-[24px] h-[24px]"
						/>
					)}
					<div className="text-lg font-medium">{row.original.name}</div>
				</div>
			);
		},
		enableHiding: false,
	},
	{
		accessorKey: "amount",
		header: "Cost",
		cell: ({ row }) => {
			const amount = Number.parseFloat(row.getValue("amount"));
			const formatted = toMoneyString(amount);

			const toX = (data: Subscription["frequency"]): string => {
				switch (data) {
					case "weekly":
						return "week";
					case "bi-weekly":
						return "2 weeks";
					case "monthly":
						return "month";
					case "bi-monthly":
						return "2 months";
					case "yearly":
						return "year";
					case "bi-yearly":
						return "2 years";
					default:
						return "";
				}
			};

			return (
				<div className="text-left">
					<div className="font-semibold text-lg">{formatted}</div>
					every {toX(row.original.frequency)}
				</div>
			);
		},
	},
	{
		accessorKey: "category",
		header: ({ column }) => {
			const { toggleSorting, SortIcon } = useTableSortState(column);

			return (
				<Button
					variant="ghost"
					className="-ml-4"
					onClick={toggleSorting}
				>
					Category
					{SortIcon && <SortIcon className="ml-2 h-4 w-4" />}
				</Button>
			);
		},
		cell: ({ row }) => {
			return (
				<Badge className="text-md" variant={"secondary"}>
					{row.original.category}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "next_invoice",
		header: ({ column }) => {
			const { toggleSorting, SortIcon } = useTableSortState(column);
			return (
				<Button
					variant="ghost"
					className="-ml-4"
					onClick={toggleSorting}
				>
					Next Invoice
					{SortIcon && <SortIcon className="ml-2 h-4 w-4" />}
				</Button>
			);
		},
		cell: ({ row }) => {
			return (
				<div className="text-left">
					<span className="text-[16px] font-medium">
						{dayjs(row.original.next_invoice).format("MMM D, YYYY")}
					</span>
					<p className="text-muted-foreground">
						({dayjs(row.original.next_invoice).fromNow()})
					</p>
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const subscription = row.original;

			const { user } = useUser();
			const { categories } = useCategories();
			const { collections } = useCollections();

			const deleteModalState = useModalState();
			const editModalState = useModalState();
			const setReminderModalState = useModalState();

			return (
				<div key={subscription.id}>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<IconDotsVertical />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="center" side="right">
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => editModalState.setState("open")}
							>
								<IconPencil className="mr-2.5 size-5" />
								<span
									className={`text-base font-medium ${lato.className}`}
								>
									Edit
								</span>
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							{user && user.todoistAPIKey !== "" && (
								<>
									<DropdownMenuItem
										className="cursor-pointer"
										onClick={() => setReminderModalState.setState("open")}
									>
										<IconAlarm className="mr-2.5 size-5" />
										<span
											className={`text-base font-medium ${lato.className}`}
										>
											Set Cancel Reminder
										</span>
									</DropdownMenuItem>

									<DropdownMenuSeparator />
								</>
							)}

							<DropdownMenuItem
								className="cursor-pointer text-red-700"
								onClick={() => deleteModalState.setState("open")}
							>
								<IconTrash className="mr-2.5 size-5" />
								<span
									className={`text-base font-medium ${lato.className}`}
								>
									Delete
								</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<EditSubscriptionModal
						state={editModalState}
						subscription={subscription}
						categories={categories || []}
						collections={collections || []}
					/>
					<DeleteSubscriptionModal
						state={deleteModalState}
						subscription_id={subscription.id}
					/>
					<SetCancelReminderModal
						state={setReminderModalState}
						subscription={subscription}
					/>
				</div>
			);
		},
	},
];
