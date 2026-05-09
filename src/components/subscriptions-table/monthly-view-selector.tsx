import { CalendarDaysIcon } from 'lucide-react';
import { getNextNMonths } from '@/features/subscriptions/utils';
import { ScrollArea } from '../ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type MonthlyViewSelectorProps = {
  selectedOption: string;
  onSelectedOptionChange: (value: string) => void;
};

export function MonthlyViewSelector({
  selectedOption,
  onSelectedOptionChange,
}: MonthlyViewSelectorProps) {
  const options = [
    'ALL',
    ...getNextNMonths(13).map((d) => d.format('MMM YYYY').toUpperCase()),
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
