import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCategory } from '@/features/categories/mutations';
import type { CategoryRecord } from '@/features/categories/queries';
import { CategoryCombobox } from '@/features/subscriptions/components/category-combobox';
import { IconPicker } from '@/features/subscriptions/components/icon-picker';
import { formatFrequency } from '@/features/subscriptions/cost';
import { formatInvoiceDate } from '@/features/subscriptions/format';
import {
  useCreateSubscription,
  useUpdateSubscription,
} from '@/features/subscriptions/mutations';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';
import {
  createSubscriptionInputSchema,
  updateSubscriptionInputSchema,
} from '@/features/subscriptions/schema';
import type {
  SubscriptionCostFrequency,
  SubscriptionStatus,
} from '@/features/subscriptions/server';
import { cn } from '@/lib/utils';

const FREQUENCY_OPTIONS: SubscriptionCostFrequency[] = [
  'weekly',
  'monthly',
  'yearly',
  'biennially',
];
const STATUS_OPTIONS: SubscriptionStatus[] = ['active', 'inactive'];

type SubscriptionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  subscription?: SubscriptionRecord | null;
  categories: CategoryRecord[];
};

type FormState = {
  name: string;
  iconRef: string;
  categoryId: string | null;
  cost: string;
  costFrequency: SubscriptionCostFrequency;
  nextInvoiceDate: string;
  status: SubscriptionStatus;
};

function emptyForm(): FormState {
  return {
    name: '',
    iconRef: '',
    categoryId: null,
    cost: '',
    costFrequency: 'monthly',
    nextInvoiceDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'active',
  };
}

function formFromSubscription(subscription: SubscriptionRecord): FormState {
  return {
    name: subscription.name,
    iconRef: subscription.iconRef,
    categoryId: subscription.categoryId,
    cost: (subscription.costAmount / 100).toString(),
    costFrequency: subscription.costFrequency,
    nextInvoiceDate: subscription.nextInvoiceDate,
    status: subscription.status,
  };
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  collectionId,
  subscription,
  categories,
}: SubscriptionFormDialogProps) {
  const isEdit = Boolean(subscription);
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const createCategory = useCreateCategory();
  const isPending =
    createSubscription.isPending || updateSubscription.isPending;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(subscription ? formFromSubscription(subscription) : emptyForm());
    setErrors({});
  }, [open, subscription]);

  function update<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  function handleCreateCategory(name: string) {
    createCategory.mutate(
      { collectionId, name },
      {
        onSuccess: (category) => update('categoryId', category.id),
        onError: () => toast.error('Failed to add category'),
      },
    );
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const costAmount = Math.round(Number.parseFloat(form.cost) * 100);
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!Number.isFinite(costAmount)) {
      nextErrors.cost = 'Enter a valid amount';
    }

    if (!form.categoryId) {
      nextErrors.categoryId = 'Category is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (isEdit && subscription) {
      const parsed = updateSubscriptionInputSchema.safeParse({
        subscriptionId: subscription.id,
        name: form.name,
        iconRef: form.iconRef,
        categoryId: form.categoryId,
        costAmount,
        costFrequency: form.costFrequency,
        nextInvoiceDate: form.nextInvoiceDate,
        status: form.status,
      });

      if (!parsed.success) {
        applyZodErrors(parsed.error, setErrors);
        return;
      }

      updateSubscription.mutate(parsed.data, {
        onSuccess: () => {
          toast.success(`Updated “${form.name}”`);
          onOpenChange(false);
        },
        onError: () => toast.error('Failed to update subscription'),
      });

      return;
    }

    const parsed = createSubscriptionInputSchema.safeParse({
      name: form.name,
      collectionId,
      iconRef: form.iconRef,
      categoryId: form.categoryId,
      costAmount,
      costFrequency: form.costFrequency,
      nextInvoiceDate: form.nextInvoiceDate,
      status: form.status,
    });

    if (!parsed.success) {
      applyZodErrors(parsed.error, setErrors);
      return;
    }

    createSubscription.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(`Added “${form.name}”`);
        onOpenChange(false);
      },
      onError: () => toast.error('Failed to add subscription'),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit subscription' : 'Add subscription'}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the details for this subscription.'
                : 'Track a new subscription in this collection.'}
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={errors.iconRef ? true : undefined}>
            <FieldLabel htmlFor="subscription-icon">Icon</FieldLabel>
            <IconPicker
              id="subscription-icon"
              value={form.iconRef}
              name={form.name}
              onChange={(domain) => update('iconRef', domain)}
              disabled={isPending}
              invalid={Boolean(errors.iconRef)}
            />
            <FieldError>{errors.iconRef}</FieldError>
          </Field>

          <Field data-invalid={errors.name ? true : undefined}>
            <FieldLabel htmlFor="subscription-name">Name</FieldLabel>
            <Input
              id="subscription-name"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="e.g. Netflix"
              aria-invalid={errors.name ? true : undefined}
              disabled={isPending}
            />
            <FieldError>{errors.name}</FieldError>
          </Field>

          <Field data-invalid={errors.categoryId ? true : undefined}>
            <FieldLabel htmlFor="subscription-category">Category</FieldLabel>
            <CategoryCombobox
              id="subscription-category"
              value={form.categoryId}
              onChange={(value) => update('categoryId', value)}
              onCreate={handleCreateCategory}
              categories={categories}
              invalid={Boolean(errors.categoryId)}
              disabled={isPending}
              creating={createCategory.isPending}
            />
            <FieldError>{errors.categoryId}</FieldError>
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field data-invalid={errors.cost ? true : undefined}>
              <FieldLabel htmlFor="subscription-cost">Cost (USD)</FieldLabel>
              <Input
                id="subscription-cost"
                value={form.cost}
                onChange={(event) => update('cost', event.target.value)}
                inputMode="decimal"
                placeholder="9.99"
                aria-invalid={errors.cost ? true : undefined}
                disabled={isPending}
              />
              <FieldError>{errors.cost}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="subscription-frequency">
                Billing frequency
              </FieldLabel>
              <Select
                value={form.costFrequency}
                onValueChange={(value) =>
                  update('costFrequency', value as SubscriptionCostFrequency)
                }
              >
                <SelectTrigger
                  id="subscription-frequency"
                  className="w-full"
                  disabled={isPending}
                >
                  <SelectValue>
                    {(value) =>
                      formatFrequency(value as SubscriptionCostFrequency)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((frequency) => (
                    <SelectItem key={frequency} value={frequency}>
                      {formatFrequency(frequency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field data-invalid={errors.nextInvoiceDate ? true : undefined}>
              <FieldLabel htmlFor="subscription-next-invoice">
                Next invoice
              </FieldLabel>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      id="subscription-next-invoice"
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      aria-invalid={errors.nextInvoiceDate ? true : undefined}
                      className={cn(
                        'w-full justify-start gap-2 font-normal',
                        !form.nextInvoiceDate && 'text-muted-foreground',
                      )}
                    />
                  }
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {form.nextInvoiceDate
                    ? formatInvoiceDate(form.nextInvoiceDate)
                    : 'Pick a date'}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      form.nextInvoiceDate
                        ? parseISO(form.nextInvoiceDate)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        update('nextInvoiceDate', format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FieldError>{errors.nextInvoiceDate}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="subscription-status">Status</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  update('status', value as SubscriptionStatus)
                }
              >
                <SelectTrigger
                  id="subscription-status"
                  className="w-full"
                  disabled={isPending}
                >
                  <SelectValue>
                    {(value) => (value === 'active' ? 'Active' : 'Inactive')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'active' ? 'Active' : 'Inactive'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" type="button" />}
              disabled={isPending}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving…'
                : isEdit
                  ? 'Save changes'
                  : 'Add subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function applyZodErrors(
  error: { issues: Array<{ path: PropertyKey[]; message: string }> },
  setErrors: (errors: Partial<Record<keyof FormState, string>>) => void,
) {
  const nextErrors: Partial<Record<keyof FormState, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (field === 'costAmount') {
      nextErrors.cost = issue.message;
      continue;
    }

    if (typeof field === 'string') {
      nextErrors[field as keyof FormState] = issue.message;
    }
  }

  setErrors(nextErrors);
}
