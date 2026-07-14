import { ListFilterIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import type { CategoryRecord } from '@/features/categories/queries';

type CategoryFilterProps = {
  options: CategoryRecord[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function CategoryFilter({
  options,
  selected,
  onChange,
}: CategoryFilterProps) {
  const selectedSet = new Set(selected);

  function toggle(optionId: string) {
    const next = new Set(selectedSet);

    if (next.has(optionId)) {
      next.delete(optionId);
    } else {
      next.add(optionId);
    }

    onChange([...next]);
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2 border-dashed" />
        }
      >
        <ListFilterIcon className="size-4" />
        Category
        {selected.length > 0 && (
          <Badge variant="secondary" className="rounded-sm px-1 font-normal">
            {selected.length}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 gap-0 p-1">
        {options.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No categories
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Checkbox
                  checked={selectedSet.has(option.id)}
                  onCheckedChange={() => toggle(option.id)}
                />
                <span className="truncate">{option.name}</span>
              </label>
            ))}
          </div>
        )}
        {selected.length > 0 && (
          <>
            <Separator className="my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => onChange([])}
            >
              Clear filters
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
