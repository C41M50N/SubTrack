import React from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { CalendarDaysIcon } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { Subscription } from "@/features/subscriptions";
import { getNextNMonths, getSubscriptionsInMonth } from "@/features/subscriptions/utils";
import dayjs from "@/lib/dayjs";
import { ScrollArea } from "../ui/scroll-area";

type MonthlyViewSelectorProps = {
  table: Table<Subscription>;
  subscriptions: Subscription[];
};

export function MonthlyViewSelector({ table, subscriptions }: MonthlyViewSelectorProps) {
  const options = [
    "ALL",
    ...getNextNMonths(13).map((d) => d.format("MMM YYYY").toUpperCase())
  ];

  const [selectedOption, setSelectedOption] = React.useState("ALL");

  const filteredSubscriptionIds = (
    selectedOption === "ALL"
      ? subscriptions.map(sub => sub.id)
      : getSubscriptionsInMonth(
          subscriptions,
          dayjs(selectedOption, "MMM YYYY").month(),
          dayjs(selectedOption, "MMM YYYY").year()
        ).map(sub => sub.id)
  );

  React.useEffect(() => {  
    // Update the table filter whenever the selected option changes
    table.getColumn("id")?.setFilterValue(filteredSubscriptionIds);
  }, [selectedOption, table, subscriptions]);

	return (
		<Select value={selectedOption} onValueChange={setSelectedOption}>
      <SelectTrigger className="w-[120px] lg:w-[150px] h-10 text-sm">
        <div className="w-full flex flex-row gap-0">
          <CalendarDaysIcon className="size-4 mt-0.5 ml-1" />
          <span className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap">
            <SelectValue
              placeholder={
                <span className="font-medium">Select Month</span>
              }
            />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-48 overflow-y-scroll">
        <ScrollArea className="w-full h-44">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                <span className="text-sm text-left font-medium">
                  {option}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </ScrollArea>
      </SelectContent>
    </Select>
	);
}
