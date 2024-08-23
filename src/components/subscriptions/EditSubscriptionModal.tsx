import Image from "next/image";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Collection } from "@prisma/client";
import { IconCalendarEvent, IconDeviceFloppy } from "@tabler/icons-react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useForm } from "react-hook-form";
import type z from "zod";

import dayjs from "@/lib/dayjs";
import {
	type ModalState,
	useCategories,
	useUpdateSubscription,
} from "@/lib/hooks";
import { cn, sleep, toProperCase } from "@/utils";

import { LoadingSpinner } from "@/components/common/loading-spinner";
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
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FREQUENCIES, ICONS } from "@/features/common/types";
import {
	type Subscription,
	SubscriptionWithoutIdSchema,
} from "@/features/subscriptions/types";

type EditSubscriptionModalProps = {
	state: ModalState;
	subscription: Subscription;
	categories: Array<string>;
	collections: Array<Omit<Collection, "userId">>;
};

export default function EditSubscriptionModal({
	state,
	subscription,
	categories,
	collections,
}: EditSubscriptionModalProps) {
	const { updateSubscription, isUpdateSubscriptionLoading } =
		useUpdateSubscription();

	const form = useForm<z.infer<typeof SubscriptionWithoutIdSchema>>({
		resolver: zodResolver(SubscriptionWithoutIdSchema),
		defaultValues: {
			...subscription,
			amount: subscription.amount / 100,
			next_invoice: new Date(subscription.next_invoice),
		},
	});

	async function onSubmit(values: z.infer<typeof SubscriptionWithoutIdSchema>) {
		await updateSubscription({ id: subscription.id, ...values });
		state.setState("closed");
	}

	return (
		<Dialog
			open={state.state === "open"}
			onOpenChange={(open) => !open && state.setState("closed")}
		>
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
															"w-full justify-between",
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
												{categories &&
													categories.map((v) => (
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
								name="collectionId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Collection</FormLabel>
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
												{collections.map((col) => (
													<SelectItem value={col.id} key={col.id}>
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
														variant={"outline"}
														className={cn(
															"w-full pl-3 text-left font-normal gap-2",
															!field.value && "text-muted-foreground",
														)}
													>
														<IconCalendarEvent stroke={1.5} />
														{field.value ? (
															<span>{dayjs(field.value).format("ll")}</span>
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
									<FormItem className="flex flex-row items-center justify-center space-y-0 space-x-2 pt-6">
										<Checkbox
											className="h-5 w-5"
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
										<FormLabel className="leading-none text-center mt-0">
											Send Alert?
										</FormLabel>
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter>
							<Button
								type="submit"
								isLoading={isUpdateSubscriptionLoading}
								className="gap-1 "
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
