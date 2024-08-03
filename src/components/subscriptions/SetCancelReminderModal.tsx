import { ModalState } from "@/lib/hooks";
import { Subscription } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { api } from "@/utils/api";
import dayjs from "dayjs";


type SetCancelReminderModalProps = {
  state: ModalState;
  subscription: Subscription;
}

export default function SetCancelReminderModal({
  state,
  subscription
}: SetCancelReminderModalProps) {
  const { data: session } = useSession();

  const {
    data: projectName,
    isLoading: isProjectNameLoading
  } = api.main.getTodoistProjectName.useQuery(undefined, { enabled: session ? session.user.todoistAPIKey !== '' : false });

  const {
    mutate: createTodoistReminder,
    isLoading: isCreateTodoistReminderLoading,
  } = api.main.createTodoistReminder.useMutation({ onSuccess: () => state.setState("closed") });

  return (
    <Dialog open={state.state === "open" ? true : false} onOpenChange={(open) => !open && state.setState("closed")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Cancel Reminder for {subscription.name}</DialogTitle>
        </DialogHeader>

        {session && !isProjectNameLoading && (
          <DialogDescription>
            A Todoist task will be created to remind you to cancel your "{subscription.name}" subscription.
            The task will be placed in the "{projectName}" project with a due date of {dayjs(subscription.next_invoice).subtract(2, 'days').format('MMMM D, YYYY')}.
          </DialogDescription>
        )}
        {(!session || isProjectNameLoading) && <LoadingSpinner />}

        <DialogFooter>
          <Button 
            isLoading={isCreateTodoistReminderLoading}
            onClick={() => createTodoistReminder({ title: subscription.name, reminder_date: dayjs(subscription.next_invoice).subtract(2, 'days').toDate() })}
          >
            Set Reminder
          </Button>

          <Button variant="destructive" onClick={() => state.setState("closed")}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
