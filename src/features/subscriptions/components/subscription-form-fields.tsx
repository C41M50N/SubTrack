import type { Collection } from '@prisma/client';
import { IconCalendarEvent } from '@tabler/icons-react';
import { format } from 'date-fns';
import { Check, ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type z from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateSubscriptionSchema } from '@/features/subscriptions';
import { FREQUENCIES, ICONS } from '@/features/subscriptions/constants';
import { cn, toProperCase } from '@/utils';

type SubscriptionFormValues = z.infer<typeof CreateSubscriptionSchema>;

type SubscriptionFormFieldsProps = {
  form: UseFormReturn<SubscriptionFormValues>;
  categories: string[];
  collections: Omit<Collection, 'user_id'>[];
  formatInvoiceDate?: (date: Date) => ReactNode;
};

const MONEY_STEP = 0.01;
const ICON_IMAGE_SIZE = 16;

function getIconSrc(icon: string): string {
  return icon.includes('.') ? `/${icon}` : `/${icon}.svg`;
}

function SubscriptionIconImage({ icon }: { icon: string }) {
  return (
    <Image
      alt={toProperCase(icon)}
      className="h-[16px] w-[16px]"
      height={ICON_IMAGE_SIZE}
      src={getIconSrc(icon)}
      width={ICON_IMAGE_SIZE}
    />
  );
}

export function SubscriptionFormFields({
  form,
  categories,
  collections,
  formatInvoiceDate = (date) => format(date, 'PPP'),
}: SubscriptionFormFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Name" {...field} type="search" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="icon_ref"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Icon</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    className={cn(
                      'w-full justify-between',
                      !field.value && 'text-muted-foreground',
                    )}
                    role="combobox"
                    variant="outline"
                  >
                    <span className="flex flex-row items-center gap-2">
                      <SubscriptionIconImage icon={field.value} />
                      {toProperCase(field.value)}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <CommandInput placeholder="Search icons..." />
                  <CommandEmpty>No icon found.</CommandEmpty>
                  <CommandList>
                    {ICONS.map((icon) => (
                      <CommandItem
                        key={icon}
                        onSelect={() => {
                          form.setValue('icon_ref', icon);
                        }}
                        value={icon}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            icon === field.value ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="flex flex-row items-center gap-2">
                          <SubscriptionIconImage icon={icon} />
                          {toProperCase(icon)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <Input step={MONEY_STEP} type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="frequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Frequency</FormLabel>
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {FREQUENCIES.map((frequency) => (
                  <SelectItem key={frequency} value={frequency}>
                    {frequency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select
              defaultValue={field.value}
              onValueChange={(value) => value !== '' && field.onChange(value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="collection_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Collection</FormLabel>
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="next_invoice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Next Invoice</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    className={cn(
                      'w-full gap-2 pl-3 text-left font-normal',
                      !field.value && 'text-muted-foreground',
                    )}
                    variant="outline"
                  >
                    <IconCalendarEvent stroke={1.5} />
                    {field.value ? (
                      formatInvoiceDate(field.value)
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  disabled={(date: Date) => date <= new Date()}
                  initialFocus
                  mode="single"
                  onSelect={field.onChange}
                  selected={field.value}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="send_alert"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-center space-x-2 space-y-0 pt-6">
            <Checkbox
              checked={field.value}
              className="h-5 w-5"
              onCheckedChange={field.onChange}
            />
            <FormLabel className="mt-0 text-center leading-none">
              Send Alert?
            </FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}
