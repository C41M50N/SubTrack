import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Subscription } from '@/features/subscriptions';
import type { ModalState } from '@/lib/hooks';
import { api } from '@/utils/api';

type SetCancelReminderModalProps = {
  state: ModalState;
  subscription: Subscription;
};

export default function SetCancelReminderModal({
  state,
  subscription,
}: SetCancelReminderModalProps) {
  const {
    mutate: createTodoistReminder,
    isLoading: isCreateTodoistReminderLoading,
  } = api.main.createTodoistReminder.useMutation({
    onSuccess: () => state.setState('closed'),
  });

  const reminder_date = dayjs(subscription.next_invoice)
    .subtract(2, 'days')
    .toDate();

  return (
    <Dialog
      onOpenChange={(open) => !open && state.setState('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Cancel Reminder for {subscription.name}</DialogTitle>
          <DialogDescription className="mt-4">
            A Todoist task will be created to remind you to cancel your "
            {subscription.name}" subscription. The task will be placed in a{' '}
            Todoist project with a due date of{' '}
            {dayjs(reminder_date).format('MMMM D, YYYY')}.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            isLoading={isCreateTodoistReminderLoading}
            onClick={() =>
              createTodoistReminder({
                title: subscription.name,
                reminder_date,
              })
            }
          >
            Set Reminder
          </Button>

          <Button
            onClick={() => state.setState('closed')}
            variant="destructive"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
