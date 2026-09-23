import { useQuery } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { SubscriptionIcon } from '@/features/subscriptions/components/subscription-icon';
import { searchBrandLogos } from '@/features/subscriptions/icons/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

type IconPickerProps = {
  value: string;
  name: string;
  onChange: (domain: string) => void;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
};

export function IconPicker({
  value,
  name,
  onChange,
  id,
  disabled,
  invalid,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const trimmedQuery = debouncedQuery.trim();

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['brand-search', trimmedQuery],
    queryFn: () => searchBrandLogos({ data: { query: trimmedQuery } }),
    enabled: open && trimmedQuery.length >= 2,
    staleTime: 60_000,
  });

  function handleSelect(domain: string) {
    onChange(domain.trim());
    setOpen(false);
    setQuery('');
  }

  const rawQuery = query.trim();
  const showCustomOption =
    rawQuery.length > 0 &&
    !results.some(
      (result) => result.domain.toLowerCase() === rawQuery.toLowerCase(),
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            className="h-auto w-full justify-start gap-3 py-2 text-left font-normal"
          />
        }
      >
        <SubscriptionIcon domain={value} name={name || value} size="sm" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">
            {value || 'Choose an icon'}
          </span>
          <span className="text-xs text-muted-foreground">
            {value ? 'Click to change' : 'Search for a brand'}
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <div className="border-b p-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search brands or enter a domain"
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {isFetching && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner /> Searching…
            </div>
          )}

          {!isFetching && trimmedQuery.length < 2 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          )}

          {!isFetching &&
            trimmedQuery.length >= 2 &&
            results.length === 0 &&
            !showCustomOption && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No brands found.
              </p>
            )}

          {!isFetching &&
            results.map((result) => (
              <button
                key={result.domain}
                type="button"
                onClick={() => handleSelect(result.domain)}
                className="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
              >
                <SubscriptionIcon
                  domain={result.domain}
                  name={result.name}
                  size="sm"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{result.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {result.domain}
                  </span>
                </span>
              </button>
            ))}

          {!isFetching && showCustomOption && (
            <button
              type="button"
              onClick={() => handleSelect(rawQuery)}
              className="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground"
            >
              <SubscriptionIcon domain={rawQuery} name={rawQuery} size="sm" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">
                  Use “<span className="font-mono">{rawQuery}</span>”
                </span>
                <span className="text-xs text-muted-foreground">
                  Custom domain
                </span>
              </span>
            </button>
          )}
        </div>
        <div className="border-t px-3 py-2 text-center text-xs text-muted-foreground">
          Logos provided by{' '}
          <a
            href="https://logo.dev"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-2 hover:text-foreground"
          >
            Logo.dev
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
