import { zodResolver } from '@hookform/resolvers/zod';
import type { Collection } from '@prisma/client';
import { IconCalendarEvent, IconDeviceFloppy } from '@tabler/icons-react';
import { Check, ChevronsUpDown } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import type z from 'zod';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
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
import {
  CreateSubscriptionSchema,
  type Subscription,
} from '@/features/subscriptions';
import dayjs from '@/lib/dayjs';
import {
  type ModalState,
  useCategories,
  useUpdateSubscription,
} from '@/lib/hooks';
import { cn, sleep, toProperCase } from '@/utils';

type EditSubscriptionModalProps = {
  state: ModalState;
  subscription: Subscription;
  categories: Array<string>;
  collections: Array<Omit<Collection, 'user_id'>>;
};

export default function EditSubscriptionModal({
  state,
  subscription,
  categories,
  collections,
}: EditSubscriptionModalProps) {
  const { updateSubscription, isUpdateSubscriptionLoading } =
    useUpdateSubscription();

  const form = useForm<z.infer<typeof CreateSubscriptionSchema>>({
    resolver: zodResolver(CreateSubscriptionSchema),
    defaultValues: {
      ...subscription,
      amount: subscription.amount / 100,
      next_invoice: new Date(subscription.next_invoice),
    },
  });

  async function onSubmit(values: z.infer<typeof CreateSubscriptionSchema>) {
    await updateSubscription({ id: subscription.id, ...values });
    state.setState('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && state.setState('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
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
                      <PopoverContent className="w-64 p-0">
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
                      <Input step={0.01} type={'number'} {...field} />
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
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories &&
                          categories.map((v) => (
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
                            variant={'outline'}
                          >
                            <IconCalendarEvent stroke={1.5} />
                            {field.value ? (
                              <span>{dayjs(field.value).format('ll')}</span>
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
              <Button
                className="gap-1"
                isLoading={isUpdateSubscriptionLoading}
                type="submit"
              >
                <IconDeviceFloppy size={20} strokeWidth={1.75} />
                <span>Save</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
