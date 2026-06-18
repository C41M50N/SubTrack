import { CalendarDaysIcon } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getNextNMonths } from '@/features/subscriptions/filters';

type MonthlyViewSelectorProps = {
  selectedOption: string;
  onSelectedOptionChange: (value: string) => void;
};

const MONTH_SELECTOR_MONTH_COUNT = 13;

export function MonthlyViewSelector({
  selectedOption,
  onSelectedOptionChange,
}: MonthlyViewSelectorProps) {
  const options = [
    'ALL',
    ...getNextNMonths(MONTH_SELECTOR_MONTH_COUNT).map((d) =>
      d.format('MMM YYYY').toUpperCase(),
    ),
  ];

  return (
    <Select onValueChange={onSelectedOptionChange} value={selectedOption}>
      <SelectTrigger className="h-10 w-[120px] bg-card text-sm lg:w-[150px]">
        <div className="flex w-full flex-row gap-0">
          <CalendarDaysIcon className="mt-0.5 ml-1 size-4" />
          <span className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap">
            <SelectValue
              placeholder={<span className="font-medium">Select Month</span>}
            />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-48 overflow-y-scroll">
        <ScrollArea className="h-44 w-full">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                <span className="text-left font-medium text-sm">{option}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
