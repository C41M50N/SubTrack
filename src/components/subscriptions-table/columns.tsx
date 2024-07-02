import Image from "next/image";
import { Roboto, Lato } from 'next/font/google';
import { useSession } from "next-auth/react";

import dayjs from "@/lib/dayjs";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { IconAlarm, IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react"

import { DemoSubscription, Subscription } from "@/lib/types";
import { toMoneyString, toXCase } from "@/lib/utils";
import { useSelectedSubscriptions } from "@/lib/stores";
import { useAllSubscriptions, useModalState } from "@/lib/hooks";

import {
	DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import EditSubscriptionModal from "@/components/subscriptions/EditSubscriptionModal";
import DeleteSubscriptionModal from "@/components/subscriptions/DeleteSubscriptionModal";
import SetCancelReminderModal from "@/components/subscriptions/SetCancelReminderModal";
import { useDemoSubscriptions, useSelectedDemoSubscriptions } from "@/lib/stores/demo-subscriptions";

const roboto = Roboto({
  weight: ['400', '500', '700'],
  style: ['normal'],
  subsets: ['latin'],
})

const lato = Lato({
	weight: ['400', '700'],
	style: ['normal'],
	subsets: ['latin']
})

export const columns: ColumnDef<Subscription>[] = [
	{
    id: "select",
    header: ({ table }) => {
			const { subscriptions } = useAllSubscriptions()
			const { setSubscriptions, resetSubscriptions } = useSelectedSubscriptions()

			return (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => {
						table.toggleAllPageRowsSelected(!!value)
						if (value === true) {
							setSubscriptions(subscriptions || [])
						} else {
							resetSubscriptions()
						}
					}}
					aria-label="Select all"
				/>
			)
		},
    cell: ({ row }) => {
			const { addSubscription, removeSubscription } = useSelectedSubscriptions()

			return (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => {
						row.toggleSelected(!!value)
						if (value === true) {
							addSubscription(row.original)
						} else {
							removeSubscription(row.original.id)
						}
					}}
					aria-label="Select row"
				/>
			)
		},
    enableSorting: true,
    enableHiding: false,
  },
	{
		accessorKey: "name",
		header: () => (<div>Name</div>),
		cell: ({ row }) => {
			const icon_ref = row.original.icon_ref;
			return (
				<div className="flex flex-row space-x-3 items-center">
					{ icon_ref.includes('.') 
						? <Image alt={toXCase(icon_ref)} src={`/${icon_ref}`} height={24} width={24} className="w-[24px] h-[24px]" />
						: <Image alt={toXCase(icon_ref)} src={`/${icon_ref}.svg`} height={24} width={24} className="w-[24px] h-[24px]" />
					}
					<div className="text-lg font-medium">{row.original.name}</div>
				</div>	
			)
		}
	},
	{
		accessorKey: "amount",
		header: () => (<div>Cost</div>),
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("amount"))
			const formatted = toMoneyString(amount);

			const toX = (data: Subscription["frequency"]): string => {
				switch (data) {
					case "weekly":
						return "week"
					case "bi-weekly":
						return "2 weeks"
					case "monthly":
						return "month"
					case "bi-monthly":
						return "2 months"
					case "yearly":
						return "year"
					case "bi-yearly":
						return "2 years"
					default:
						return ""
				}
			}
	
			return (
			<div className="text-left">
				<div className={`font-medium text-lg ${roboto.className}`}>{formatted}</div>
				every {toX(row.original.frequency)}
			</div>
			)
		}
	},
	{
		accessorKey: "category",
		header: () => (<div>Category</div>),
		cell: ({ row }) => {
			return (
				<Badge className="text-md" variant={"secondary"}>{row.original.category}</Badge>
			)
		}
	},
	{
		accessorKey: "next_invoice",
		header: ({ column }) => {
			return (
				<Button
          variant="ghost"
          onClick={() => {
						column.toggleSorting(false)	// orders subscriptions by closest `next_invoice`
					}}
        >
          Next Invoice
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
			)
		},
		cell: ({ row }) => {
			return (
				<div className="text-left">
					<span className="text-[16px]">{dayjs(row.original.next_invoice).format("MMM D, YYYY")}</span>
					<p className="text-muted-foreground">({dayjs(row.original.next_invoice).fromNow()})</p>
				</div>
			)
		}
	},
	{
    id: "actions",
    cell: ({ row }) => {
      const subscription = row.original;

			const { data: session } = useSession();

			const deleteModalState = useModalState();
			const editModalState = useModalState();
			const setReminderModalState = useModalState();
 
      return (
				<>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<IconDotsVertical />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="center" side="right">
							<DropdownMenuItem className="cursor-pointer" onClick={() => editModalState.setState("open")}>
								<IconPencil stroke={1.75} />
								<span className={`text-base font-medium pl-2 ${lato.className}`}>Edit</span>
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							{session?.user.todoistAPIKey !== "" && (
								<>
									<DropdownMenuItem className="cursor-pointer" onClick={() => setReminderModalState.setState("open")}>
										<IconAlarm stroke={1.75} />
										<span className={`text-base font-medium pl-2 ${lato.className}`}>Set Cancel Reminder</span>
									</DropdownMenuItem>

									<DropdownMenuSeparator />
								</>
							)}

							<DropdownMenuItem className="cursor-pointer text-red-700" onClick={() => deleteModalState.setState("open")}>
								<IconTrash stroke={1.75} />
								<span className={`text-base font-medium pl-2 ${lato.className}`}>Delete</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<EditSubscriptionModal state={editModalState} subscription={subscription} />
					<DeleteSubscriptionModal state={deleteModalState} subscription_id={subscription.id} />
					<SetCancelReminderModal state={setReminderModalState} subscription={subscription} />
				</>
      )
    },
  },
]

export const demoColumns = [
	{
    id: "select",
    header: ({ table }) => {
			const { subscriptions } = useDemoSubscriptions()
			const { setSubscriptions, resetSubscriptions } = useSelectedDemoSubscriptions()

			return (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => {
						table.toggleAllPageRowsSelected(!!value)
						if (value === true) {
							setSubscriptions(subscriptions || [])
						} else {
							resetSubscriptions()
						}
					}}
					aria-label="Select all"
				/>
			)
		},
		cell: ({ row }) => {
			const { addSubscription, removeSubscription } = useSelectedDemoSubscriptions()

			return (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => {
						row.toggleSelected(!!value)
						if (value === true) {
							addSubscription(row.original)
						} else {
							removeSubscription(row.original.id)
						}
					}}
					aria-label="Select row"
				/>
			)
		},
    enableSorting: true,
    enableHiding: false,
	},
	...columns.slice(1, columns.length-1),
	{
    id: "actions",
    cell: ({ row }) => {
      const subscription = row.original;

			const deleteModalState = useModalState();
			const editModalState = useModalState();
 
      return (
				<>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<IconDotsVertical />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="center" side="right">
							<DropdownMenuItem className="cursor-pointer" onClick={() => editModalState.setState("open")}>
								<IconPencil stroke={1.75} />
								<span className={`text-base font-medium pl-2 ${lato.className}`}>Edit</span>
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							<DropdownMenuItem className="cursor-pointer text-red-700" onClick={() => deleteModalState.setState("open")}>
								<IconTrash stroke={1.75} />
								<span className={`text-base font-medium pl-2 ${lato.className}`}>Delete</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<EditSubscriptionModal demo state={editModalState} subscription={subscription} />
					<DeleteSubscriptionModal demo state={deleteModalState} subscription_id={subscription.id} />
				</>
      )
    },
  },
] as ColumnDef<DemoSubscription>[]
