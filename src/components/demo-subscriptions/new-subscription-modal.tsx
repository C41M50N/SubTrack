import Image from "next/image";
import React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconCalendarEvent } from "@tabler/icons-react";
import { format } from "date-fns";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import type z from "zod";

import {
	CreateDemoSubscriptionSchema,
	DEMO_CATEGORIES,
} from "@/features/demo-subscriptions";
import {
	useDemoSubscriptions,
	useNewDemoSubscriptionModal,
} from "@/features/demo-subscriptions/stores";
import { cn, sleep, toProperCase } from "@/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FREQUENCIES, ICONS } from "@/features/common";

export default function NewSubscriptionModal() {
	const newDemoSubscriptionModalState = useNewDemoSubscriptionModal();

	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const { addSubscription: addDemoSubscription } = useDemoSubscriptions();

	const form = useForm<z.infer<typeof CreateDemoSubscriptionSchema>>({
		resolver: zodResolver(CreateDemoSubscriptionSchema),
		defaultValues: {
			name: "",
			amount: 10.0,
			frequency: "monthly",
			icon_ref: "default",
			next_invoice: new Date(),
			send_alert: true,
		},
	});

	async function onSubmit(
		values: z.infer<typeof CreateDemoSubscriptionSchema>,
	) {
		setIsLoading(true);
		await sleep(500);
		setIsLoading(false);
		addDemoSubscription(values);
		form.reset();
		newDemoSubscriptionModalState.set("closed");
	}

	return (
		<Dialog
			open={newDemoSubscriptionModalState.state === "open"}
			onOpenChange={(open) =>
				!open && newDemoSubscriptionModalState.set("closed")
			}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New Subscription</DialogTitle>
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
														variant="outline"
														role="combobox"
														className={cn(
															"w-[200px] justify-between",
															!field.value && "text-muted-foreground",
														)}
													>
														<span className="flex flex-row items-center gap-2">
															{field.value.includes(".") ? (
																<Image
																	alt={toProperCase(field.value)}
																	src={`/${field.value}`}
																	height={16}
																	width={16}
																	className="w-[16px] h-[16px]"
																/>
															) : (
																<Image
																	alt={toProperCase(field.value)}
																	src={`/${field.value}.svg`}
																	height={16}
																	width={16}
																	className="w-[16px] h-[16px]"
																/>
															)}
															{toProperCase(field.value)}
														</span>
														<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="p-0 w-64">
												<Command
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<CommandInput placeholder="Search icons..." />
													<CommandEmpty>No icon found.</CommandEmpty>
													<CommandList>
														{ICONS.map((icon) => (
															<CommandItem
																value={icon}
																key={icon}
																onSelect={() => {
																	form.setValue("icon_ref", icon);
																}}
															>
																<Check
																	className={cn(
																		"mr-2 h-4 w-4",
																		icon === field.value
																			? "opacity-100"
																			: "opacity-0",
																	)}
																/>
																<span className="flex flex-row items-center gap-2">
																	{icon.includes(".") ? (
																		<Image
																			alt={toProperCase(icon)}
																			src={`/${icon}`}
																			height={16}
																			width={16}
																			className="w-[16px] h-[16px]"
																		/>
																	) : (
																		<Image
																			alt={toProperCase(icon)}
																			src={`/${icon}.svg`}
																			height={16}
																			width={16}
																			className="w-[16px] h-[16px]"
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
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{FREQUENCIES.map((v) => (
													<SelectItem value={v} key={v}>
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
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{DEMO_CATEGORIES.map((v) => (
													<SelectItem value={v} key={v}>
														{v}
													</SelectItem>
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
															!field.value && "text-muted-foreground",
														)}
													>
														<IconCalendarEvent stroke={1.5} />
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
													disabled={(date: Date) => date <= new Date()}
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
										<Checkbox
											className="h-6 w-6"
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
										<FormLabel>Send Alert?</FormLabel>
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter>
							<Button type="submit" isLoading={isLoading}>
								Submit
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
