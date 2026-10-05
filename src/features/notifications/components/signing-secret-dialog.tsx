import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { formatTimestamp } from '@/features/notifications/components/destination-display';

export type RevealedSecret = {
  destinationName: string;
  signingSecret: string;
  /** Set after a rotation: when the last earlier secret stops signing requests. */
  previousSecretExpiresAt?: Date;
};

type SigningSecretDialogProps = {
  secret: RevealedSecret | null;
  onOpenChange: (open: boolean) => void;
};

/** Shows a webhook signing secret once, right after it's created or rotated. */
export function SigningSecretDialog({
  secret,
  onOpenChange,
}: SigningSecretDialogProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!secret) {
      return;
    }

    try {
      await navigator.clipboard.writeText(secret.signingSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Couldn’t copy. Select the secret and copy it instead.');
    }
  }

  return (
    <Dialog
      open={secret !== null}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false);
        }

        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Signing secret for {secret?.destinationName}
          </DialogTitle>
          <DialogDescription>
            Copy this now. For security, EverySub won’t show it again. If you
            lose it, rotate the secret to get a new one.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="signing-secret">Signing secret</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="signing-secret"
              readOnly
              value={secret?.signingSecret ?? ''}
              className="font-mono text-xs"
              onFocus={(event) => event.currentTarget.select()}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onClick={handleCopy}
                aria-label={copied ? 'Copied' : 'Copy signing secret'}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>
            Each request carries <code>webhook-id</code>,{' '}
            <code>webhook-timestamp</code>, and <code>webhook-signature</code>{' '}
            headers following the Standard Webhooks spec. Verify the signature
            with this secret and reject stale timestamps.
          </FieldDescription>
          {secret?.previousSecretExpiresAt ? (
            <FieldDescription>
              Earlier secrets also sign requests until{' '}
              {formatTimestamp(secret.previousSecretExpiresAt)}, so your
              receiver keeps working while you update it.
            </FieldDescription>
          ) : null}
        </Field>

        <span className="sr-only" aria-live="polite">
          {copied ? 'Signing secret copied' : ''}
        </span>

        <DialogFooter>
          <DialogClose render={<Button type="button" />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
