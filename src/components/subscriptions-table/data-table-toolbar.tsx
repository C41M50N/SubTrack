import { Table } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { IconCircleX } from "@tabler/icons-react"
import { DataTableFilter } from "./data-table-filter"
import { DataTableViewOptions } from "./data-table-view-options"
import MoreOptions from "./more-options"

type Props<TData> = {
  table: Table<TData>
  categories: string[]
}

export default function DataTableToolbar<TData>({ table, categories }: Props<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter subscriptions..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[200px] lg:w-[280px]"
        />
        {table.getColumn("category") && (
          <DataTableFilter
            column={table.getColumn("category")}
            title="Category"
            options={categories.map((cat) => ({ label: cat, value: cat }))}
          />
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <IconCircleX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-row space-x-3">
        <DataTableViewOptions table={table} />
        <MoreOptions />
      </div>
    </div>
  )
}
