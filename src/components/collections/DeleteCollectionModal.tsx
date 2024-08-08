import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ModalState } from "@/lib/hooks";
import { toProperCase } from "@/utils";
import { api } from "@/utils/api";
import type { Collection } from "@prisma/client";
import { IconTrash } from "@tabler/icons-react";
import Image from "next/image";
import { LoadingSpinner } from "../common/loading-spinner";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { toast } from "../ui/use-toast";

type Props = {
	state: ModalState;
	collectionId: Collection["id"];
};

export default function DeleteCollectionModal({ state, collectionId }: Props) {
	const ctx = api.useContext();

	const { data: subscriptions, isLoading: isGetSubscriptionsLoading } =
		api.subscriptions.getSubscriptionsFromCollection.useQuery(collectionId);

	const { mutateAsync: deleteCollection } =
		api.collections.deleteCollection.useMutation({
			onSuccess() {
				ctx.collections.getCollections.refetch();
				ctx.subscriptions.getSubscriptions.refetch();
			},
			onError(error) {
				toast({
					variant: "error",
					title: error.message,
				});
			},
		});

	async function onSubmit() {
		await deleteCollection({ collectionId });
		state.setState("closed");
	}

	return (
		<Dialog
			open={state.state === "open"}
			onOpenChange={(open) => !open && state.setState("closed")}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Collection</DialogTitle>
					<DialogDescription>
						This action cannot be undone. Are you sure you want to permanently
						delete the following subscriptions?
					</DialogDescription>
				</DialogHeader>

				{!subscriptions && <LoadingSpinner />}

				{subscriptions && (
					<div className="mt-1 space-y-2">
						<span className="text-sm font-medium leading-none">
							Subscriptions to be deleted:
						</span>
						<ScrollArea className="w-full h-52 px-4 rounded-sm border">
							{subscriptions.map((sub) => (
								<div key={sub.id} className="first:pt-3">
									<div className="flex flex-row space-x-3 items-center">
										{sub.icon_ref.includes(".") ? (
											<Image
												alt={toProperCase(sub.icon_ref)}
												src={`/${sub.icon_ref}`}
												height={18}
												width={18}
												className="w-[18px] h-[18px]"
											/>
										) : (
											<Image
												alt={toProperCase(sub.icon_ref)}
												src={`/${sub.icon_ref}.svg`}
												height={18}
												width={18}
												className="w-[18px] h-[18px]"
											/>
										)}
										<div className="text-base font-medium">{sub.name}</div>
									</div>
									<Separator className="my-3" />
								</div>
							))}
						</ScrollArea>
					</div>
				)}

				<DialogFooter className="mt-2">
					<Button
						type="submit"
						className="gap-1"
						variant={"destructive"}
						disabled={isGetSubscriptionsLoading}
						onClick={onSubmit}
					>
						<IconTrash size={20} strokeWidth={1.75} />
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
