"use client"
import { mkConfig, generateCsv, download } from "export-to-csv";
import { CircleEllipsisIcon } from "lucide-react"
import { useSelectedSubscriptions } from "@/lib/stores"
import dayjs from "@/lib/dayjs"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default function MoreOptions() {

  const { subscriptions } = useSelectedSubscriptions()

  function exportSubscriptionsToCSV() {
    const csvConfig = mkConfig({
      filename: `SubTrack Subscriptions - ${dayjs().format('YYYY-MM-DD')}`,
      useKeysAsHeaders: true
    });

    const csv = generateCsv(csvConfig)(
      subscriptions
        .map(({ id, userId, icon_ref, ...rest }) => rest)
        .map(
          ({ next_invoice, last_invoice, ...rest }) => ({
            ...rest,
            next_invoice: dayjs(next_invoice).format('MM/DD/YYYY'), 
            last_invoice: last_invoice !== null ? dayjs(last_invoice).format('MM/DD/YYYY') : '', 
          })
        )
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
  )
}
