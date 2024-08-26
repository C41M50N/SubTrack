import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { Subscription } from "@/features/subscriptions/types";
import { type ModalState, useUser } from "@/lib/hooks";
import { api } from "@/utils/api";
import dayjs from "dayjs";

type SetCancelReminderModalProps = {
	state: ModalState;
	subscription: Subscription;
};

export default function SetCancelReminderModal({
	state,
	subscription,
}: SetCancelReminderModalProps) {
	const { user } = useUser();

	const { data: projectName, isLoading: isProjectNameLoading } =
		api.main.getTodoistProjectName.useQuery(undefined, {
			enabled: user ? user.todoistAPIKey !== "" : false,
		});

	const {
		mutate: createTodoistReminder,
		isLoading: isCreateTodoistReminderLoading,
	} = api.main.createTodoistReminder.useMutation({
		onSuccess: () => state.setState("closed"),
	});

	return (
		<Dialog
			open={state.state === "open"}
			onOpenChange={(open) => !open && state.setState("closed")}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Set Cancel Reminder for {subscription.name}</DialogTitle>
				</DialogHeader>

				{user && !isProjectNameLoading && (
					<DialogDescription>
						A Todoist task will be created to remind you to cancel your "
						{subscription.name}" subscription. The task will be placed in the "
						{projectName}" project with a due date of{" "}
						{dayjs(subscription.next_invoice)
							.subtract(2, "days")
							.format("MMMM D, YYYY")}
						.
					</DialogDescription>
				)}
				{(!user || isProjectNameLoading) && <LoadingSpinner />}

				<DialogFooter>
					<Button
						isLoading={isCreateTodoistReminderLoading}
						onClick={() =>
							createTodoistReminder({
								title: subscription.name,
								reminder_date: dayjs(subscription.next_invoice)
									.subtract(2, "days")
									.toDate(),
							})
						}
					>
						Set Reminder
					</Button>

					<Button
						variant="destructive"
						onClick={() => state.setState("closed")}
					>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
