import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useDemoSubscriptions } from "@/features/demo-subscriptions/stores";
import type { ModalState } from "@/lib/hooks";
import { sleep } from "@/utils";
import { IconTrash } from "@tabler/icons-react";
import React from "react";

type DeleteSubscriptionModalProps = {
	state: ModalState;
	subscription_id: string;
};

export default function DeleteSubscriptionModal({
	state,
	subscription_id,
}: DeleteSubscriptionModalProps) {
	const [isLoading, setIsLoading] = React.useState<boolean>(false);
	const { removeSubscription } = useDemoSubscriptions();

	async function onSubmit() {
		setIsLoading(true);
		await sleep(500);
		setIsLoading(false);
		removeSubscription(subscription_id);
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
						delete this subscription?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type="submit"
						variant={"destructive"}
						isLoading={isLoading}
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
