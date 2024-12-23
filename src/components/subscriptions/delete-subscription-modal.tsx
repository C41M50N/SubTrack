import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { SubscriptionId } from "@/features/subscriptions";
import { type ModalState, useDeleteSubscription } from "@/lib/hooks";
import { IconTrash } from "@tabler/icons-react";
import React from "react";

type DeleteSubscriptionModalProps = {
	state: ModalState;
	subscription_id: SubscriptionId;
};

export default function DeleteSubscriptionModal({
	state,
	subscription_id,
}: DeleteSubscriptionModalProps) {
	const { deleteSubscription, isDeleteSubscriptionLoading } =
		useDeleteSubscription();

	async function onSubmit() {
		await deleteSubscription({ subscriptionId: subscription_id });
		state.setState("closed");
	}

	return (
		<Dialog
			open={state.state === "open"}
			onOpenChange={(open) => !open && state.setState("closed")}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Subscription</DialogTitle>
					<DialogDescription>
						This action cannot be undone. Are you sure you want to permanently
						delete this subscription from our servers?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type="submit"
						variant={"destructive"}
						isLoading={isDeleteSubscriptionLoading}
						onClick={onSubmit}
						className="gap-1"
					>
						<IconTrash size={20} strokeWidth={1.75} />
						<span>Delete</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
