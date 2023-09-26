import React from "react"
import Image from "next/image"

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

import { ModalState } from "@/lib/hooks"
import { cn, toXCase } from "@/lib/utils"
import { CATEGORIES, FREQUENCIES, ICONS, Subscription } from "@/lib/types"

import z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconCalendar, IconCalendarEvent, IconDeviceFloppy } from "@tabler/icons-react"
import { format } from "date-fns"


type EditSubscriptionModalProps = {
  state: ModalState
  subscription: Subscription
}

const EditSubscriptionSchema = z.object({
  name: z.string()
          .min(2, { message: "Name must be at least 2 characters" })
          .max(30, { message: "Name must be at most 30 characters" }),
  amount: z.number()
            .multipleOf(0.01)
            .min(0.01, { message: "Amount must be at least $0.01" })
            .max(100_000.00, { message: "Amount must be at most $100,000.00" }),
  frequency: z.enum(FREQUENCIES),
  category: z.string(),
  icon: z.enum(ICONS),
  next_invoice: z.date()
})

export default function EditSubscriptionModal ({ state, subscription }: EditSubscriptionModalProps) {

  const form = useForm<z.infer<typeof EditSubscriptionSchema>>({
    resolver: zodResolver(EditSubscriptionSchema),
    defaultValues: subscription,
  })

  function onSubmit(values: z.infer<typeof EditSubscriptionSchema>) {
    console.log(values)
  }

  return (
    <Dialog open={state.state === "open" ? true : false} onOpenChange={(open) => !open && state.setState("closed")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
        </DialogHeader>
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
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
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
                        {[...ICONS, "default"].map((v) => {
                          const xcase = toXCase(v)
                          return (
                            <SelectItem value={v}>
                              <span className="flex flex-row gap-2">
                                {v === "default" && <Image alt={xcase} src={`/default.svg`} height={16} width={16} />}
                                {v !== "default" && <Image alt={xcase} src={`/${v}.svg`} height={16} width={16} />}
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
                      <Input type={"number"} step={0.01} {...field} />
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
                          <SelectItem value={v}>{v}</SelectItem>
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
                        {CATEGORIES.map((v) => (
                          <SelectItem value={v}>{v}</SelectItem>
                        ))}
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
                name="next_invoice"
                render={({ field }) => (
                  <FormItem className="col-span-2">
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
            </div>

          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" onClick={() => form.handleSubmit(onSubmit)} className="gap-1"><IconDeviceFloppy size={20} /> Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
