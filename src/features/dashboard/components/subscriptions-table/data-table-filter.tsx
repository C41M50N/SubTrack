import { CheckIcon, ListFilterIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils';

type DataTableFilterProps = {
  title?: string;
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  options: {
    label: string;
    value: string;
    count?: number;
  }[];
};

export function DataTableFilter({
  title,
  selectedValues,
  onSelectedValuesChange,
  options,
}: DataTableFilterProps) {
  const selectedValueSet = new Set(selectedValues);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-10 border-dashed bg-card"
          size="sm"
          variant="outline"
        >
          <ListFilterIcon
            className={cn('mr-2 size-4', selectedValueSet.size > 0 && 'mr-1')}
          />
          {title}
          {selectedValueSet.size > 0 && (
            <>
              <Separator className="mx-2 h-4" orientation="vertical" />
              <Badge
                className="rounded-sm px-1 font-normal lg:hidden"
                variant="secondary"
              >
                {selectedValueSet.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValueSet.size > 2 ? (
                  <Badge
                    className="rounded-sm px-1 font-normal"
                    variant="secondary"
                  >
                    {selectedValueSet.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValueSet.has(option.value))
                    .map((option) => (
                      <Badge
                        className="rounded-sm px-1 font-normal"
                        key={option.value}
                        variant="secondary"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValueSet.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const nextSelectedValues = new Set(selectedValueSet);
                      if (isSelected) {
                        nextSelectedValues.delete(option.value);
                      } else {
                        nextSelectedValues.add(option.value);
                      }
                      onSelectedValuesChange(Array.from(nextSelectedValues));
                    }}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    <span>{option.label}</span>
                    {option.count && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {option.count}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValueSet.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    className="justify-center text-center"
                    onSelect={() => onSelectedValuesChange([])}
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
