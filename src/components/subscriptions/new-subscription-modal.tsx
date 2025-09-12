import { zodResolver } from '@hookform/resolvers/zod';
import type { Collection } from '@prisma/client';
import { IconCalendarEvent } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useAtom } from 'jotai';
import { Check, ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useForm } from 'react-hook-form';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
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
import { FREQUENCIES, ICONS } from '@/features/common';
import { selectedCollectionIdAtom } from '@/features/common/atoms';
import { CreateSubscriptionSchema } from '@/features/subscriptions';
import { useNewSubscriptionModal } from '@/features/subscriptions/stores';
import { useCreateSubscription } from '@/lib/hooks';
import { cn, toProperCase } from '@/utils';

type NewSubscriptionModalProps = {
  categories: string[];
  collections: Omit<Collection, 'user_id'>[];
};

export default function NewSubscriptionModal({
  categories,
  collections,
}: NewSubscriptionModalProps) {
  const newSubscriptionModalState = useNewSubscriptionModal();

  const { createSubscription, isCreateSubscriptionLoading } =
    useCreateSubscription();

  const [selectedCollectionId, _] = useAtom(selectedCollectionIdAtom);

  const form = useForm<z.infer<typeof CreateSubscriptionSchema>>({
    resolver: zodResolver(CreateSubscriptionSchema),
    defaultValues: {
      name: '',
      amount: 10.0,
      frequency: 'monthly',
      icon_ref: 'default',
      next_invoice: new Date(),
      send_alert: true,
    },
  });

  React.useEffect(() => {
    if (categories[0]) {
      form.setValue('category', categories[0]);
    }

    if (selectedCollectionId) {
      form.setValue('collection_id', selectedCollectionId);
    }
  }, [newSubscriptionModalState]);

  async function onSubmit(values: z.infer<typeof CreateSubscriptionSchema>) {
    await createSubscription(values);
    form.reset();
    newSubscriptionModalState.set('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && newSubscriptionModalState.set('closed')}
      open={newSubscriptionModalState.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Subscription</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                              !field.value && 'text-muted-foreground'
                            )}
                            role="combobox"
                            variant="outline"
                          >
                            <span className="flex flex-row items-center gap-2">
                              {field.value.includes('.') ? (
                                <Image
                                  alt={toProperCase(field.value)}
                                  className="h-[16px] w-[16px]"
                                  height={16}
                                  src={`/${field.value}`}
                                  width={16}
                                />
                              ) : (
                                <Image
                                  alt={toProperCase(field.value)}
                                  className="h-[16px] w-[16px]"
                                  height={16}
                                  src={`/${field.value}.svg`}
                                  width={16}
                                />
                              )}
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
                                    icon === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                <span className="flex flex-row items-center gap-2">
                                  {icon.includes('.') ? (
                                    <Image
                                      alt={toProperCase(icon)}
                                      className="h-[16px] w-[16px]"
                                      height={16}
                                      src={`/${icon}`}
                                      width={16}
                                    />
                                  ) : (
                                    <Image
                                      alt={toProperCase(icon)}
                                      className="h-[16px] w-[16px]"
                                      height={16}
                                      src={`/${icon}.svg`}
                                      width={16}
                                    />
                                  )}
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
                      <Input step={0.01} type="number" {...field} />
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
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
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
                      onValueChange={(v) => v !== '' && field.onChange(v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((v) => (
                          <SelectItem key={v} value={v.toString()}>
                            {v}
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
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {collections.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.title}
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
                              !field.value && 'text-muted-foreground'
                            )}
                            variant="outline"
                          >
                            <IconCalendarEvent stroke={1.5} />
                            {field.value ? (
                              format(field.value, 'PPP')
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

            <DialogFooter>
              <Button isLoading={isCreateSubscriptionLoading} type="submit">
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
