import React from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getNextNMonths } from "@/features/common/calculations-helpers";
import { CalendarDaysIcon } from "lucide-react";

export function MonthlyViewSelector() {
  const options = [
    "ALL",
    ...getNextNMonths(13).map((d) => d.format("MMM YYYY").toUpperCase())
  ];

	return (
		<Select defaultValue="ALL">
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
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
	);
}
