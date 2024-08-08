import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/use-toast";
import type { CollectionWithoutUserId } from "@/features/collections/types";
import type { ModalState } from "@/lib/hooks";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconDeviceFloppy } from "@tabler/icons-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Props = {
	state: ModalState;
	collection: CollectionWithoutUserId;
};

const FormSchema = z.object({
	title: z
		.string()
		.min(2, { message: "Title must be at least 2 characters" })
		.max(30, { message: "Title must be at most 30 characters" }),
});

export default function EditCollectionModal({
	state,
	collection
}: Props) {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			title: collection.title,
		},
	});

	const ctx = api.useContext();
	const {
		mutateAsync: editCollectionTitle,
		isLoading: isEditCollectionLoading,
	} = api.collections.editCollectionTitle.useMutation({
		onSuccess(data, variables, context) {
			form.reset();
			ctx.collections.getCollections.refetch();
		},
		onError(error, variables, context) {
			toast({
				variant: "error",
				title: error.message,
			});
		},
	});

	React.useEffect(() => {
		form.setValue('title', collection.title)
	}, [state])

	async function onSubmit(values: z.infer<typeof FormSchema>) {
		await editCollectionTitle({
			title: values.title,
			collection_id: collection.id,
		});
		state.setState("closed");
	}

	return (
		<Dialog
			open={state.state === "open"}
			onOpenChange={(open) => !open && state.setState("closed")}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Collection</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="title"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input
											placeholder="Collection Title"
											{...field}
											type="search"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="submit"
								className="gap-1"
								isLoading={isEditCollectionLoading}
							>
								<IconDeviceFloppy size={20} strokeWidth={1.75} />
								Save
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
