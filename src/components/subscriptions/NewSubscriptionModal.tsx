import React from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"

import z from "zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconCalendar, IconCalendarEvent, IconDeviceFloppy } from "@tabler/icons-react"
import { format } from "date-fns"

import { api } from "@/utils/api"
import { ModalState, useCategories, useCreateSubscription } from "@/lib/hooks"
import { cn, toXCase } from "@/lib/utils"
import { FREQUENCIES, ICONS, SubscriptionSchema } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

type NewSubscriptionModalProps = {
  state: ModalState
}

export default function NewSubscriptionModal({ state }: NewSubscriptionModalProps) {

  const { categories, isCategoriesLoading } = useCategories()
  const { createSubscription, isCreateSubscriptionLoading } = useCreateSubscription(() => {}, () => {
    form.reset()
    state.setState("closed")
  })

  const form = useForm<z.infer<typeof SubscriptionSchema>>({
    resolver: zodResolver(SubscriptionSchema),
    defaultValues: {
      name: "",
      amount: 10.00,
      frequency: "monthly",
      icon_ref: "default",
      next_invoice: new Date(),
      send_alert: true
    }
  })

  function onSubmit(values: z.infer<typeof SubscriptionSchema>) {
    createSubscription(values)
  }

  return (
    <Dialog open={state.state === "open" ? true : false} onOpenChange={(open) => !open && state.setState("closed")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Subscription</DialogTitle>
        </DialogHeader>

        {isCategoriesLoading && (
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </div>
        )}

        {!isCategoriesLoading && (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[...ICONS].map((v) => {
                              const xcase = toXCase(v)
                              return (
                                <SelectItem value={v} key={v}>
                                  <span className="flex flex-row items-center gap-2">
                                    {v === "default" && <Image alt={xcase} src={`/default.svg`} height={16} width={16} className="w-[16px] h-[16px]" />}
                                    {v !== "default" && <Image alt={xcase} src={`/${v}.svg`} height={16} width={16} className="w-[16px] h-[16px]" />}
                                    {xcase}
                                  </span>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step={0.01} {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FREQUENCIES.map((v) => (
                              <SelectItem value={v} key={v}>{v}</SelectItem>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories && categories.map((v) => (
                              <SelectItem value={v} key={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-10 gap-4">
                  <FormField
                    control={form.control}
                    name="next_invoice"
                    render={({ field }) => (
                      <FormItem className="col-span-6">
                        <FormLabel>Next Invoice</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal gap-2",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <IconCalendarEvent stroke={1.50}/>
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date: Date) =>
                                date <= new Date()
                              }
                              initialFocus
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
                      <FormItem className="col-span-4 flex flex-row items-center justify-center space-x-2 pt-6">
                        <Checkbox className="h-6 w-6" checked={field.value} onCheckedChange={field.onChange} />
                        <FormLabel>Send Alert?</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" isLoading={isCreateSubscriptionLoading}>Submit</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}