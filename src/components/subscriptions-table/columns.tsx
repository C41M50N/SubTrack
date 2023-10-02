import Image from "next/image";
import { Roboto, Lato } from 'next/font/google';

import dayjs from "@/lib/dayjs";
import { ColumnDef } from "@tanstack/react-table"
import { IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react"

import { Subscription } from "@/lib/types";
import { useModalState } from "@/lib/hooks";
import { toMoneyString } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import EditSubscriptionModal from "@/components/subscriptions/EditSubscriptionModal";
import DeleteSubscriptionModal from "@/components/subscriptions/DeleteSubscriptionModal";

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

export const subscriptions: Omit<Subscription, "userId">[] = [
	{
		id: "1",
		name: "Spotify",
		amount: 4.99,
		frequency: "monthly",
		category: "productivity",
		next_invoice: new Date(),
		icon_ref: "spotify",
		send_alert: true
	},
	{
		id: "2",
		name: "Amazon Prime",
		amount: 73.14,
		frequency: "yearly",
		category: "entertainment",
		next_invoice: dayjs('Aug 17, 2024').toDate(),
		icon_ref: "amazon",
		send_alert: true
	},
	{
		id: "3",
		name: "Google One",
		amount: 20.00,
		frequency: "yearly",
		category: "entertainment",
		next_invoice: dayjs('Aug 17, 2025').toDate(),
		icon_ref: "google-one",
		send_alert: true
	},
	{
		id: "4",
		name: "Proton",
		amount: 158.99,
		frequency: "bi-yearly",
		category: "productivity",
		next_invoice: dayjs('Aug 17, 2025').toDate(),
		icon_ref: "proton",
		send_alert: true
	},
	{
		id: "5",
		name: "Todoist",
		amount: 36.00,
		frequency: "yearly",
		category: "productivity",
		next_invoice: dayjs('Jul 4, 2024').toDate(),
		icon_ref: "todoist",
		send_alert: true
	},
	{
		id: "999",
		name: "Test",
		amount: 20000.00,
		frequency: "bi-yearly",
		category: "entertainment",
		next_invoice: dayjs('Aug 20, 2024').toDate(),
		icon_ref: "default",
		send_alert: true
	}
]

export const columns: ColumnDef<Subscription>[] = [
	{
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: true,
    enableHiding: false,
  },
	{
		accessorKey: "name",
		header: () => (<div>Name</div>),
		cell: ({ row }) => {
			return (
				<div className="flex flex-row space-x-3 items-center">
					{row.original.icon_ref !== "default" && (
						<Image alt={row.original.name} src={`/${row.original.icon_ref}.svg`} height={24} width={24} />
					)}
					{row.original.icon_ref === "default" && (
						<Image alt={row.original.name} src={`/default.svg`} height={24} width={24} />
					)}
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
		header: () => (<div>Next Invoice</div>),
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
									<span className={`text-[16px] font-semibold pl-2 ${lato.className}`}>Edit</span>
								</DropdownMenuItem>

								<DropdownMenuSeparator />

								<DropdownMenuItem className="cursor-pointer text-red-700" onClick={() => deleteModalState.setState("open")}>
									<IconTrash stroke={1.75} />
									<span className={`text-[16px] font-semibold pl-2 ${lato.className}`}>Delete</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

					<EditSubscriptionModal state={editModalState} subscription={subscription} />
					<DeleteSubscriptionModal state={deleteModalState} subscription_id={subscription.id} />
				</>
      )
    },
  },
]
