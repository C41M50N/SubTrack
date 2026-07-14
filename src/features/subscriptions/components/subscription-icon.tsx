import { useEffect, useState } from 'react';

import {
  buildLogoImageUrl,
  initialsFromName,
} from '@/features/subscriptions/icons/client';
import { cn } from '@/lib/utils';

const sizeStyles = {
  sm: { box: 'size-6 text-[10px]', px: 48 },
  md: { box: 'size-8 text-xs', px: 64 },
  lg: { box: 'size-10 text-sm', px: 80 },
} as const;

type SubscriptionIconProps = {
  /** Domain stored on the subscription (iconRef), e.g. "netflix.com". */
  domain: string;
  /** Subscription name, used for the initials fallback and alt text. */
  name: string;
  size?: keyof typeof sizeStyles;
  className?: string;
};

export function SubscriptionIcon({
  domain,
  name,
  size = 'md',
  className,
}: SubscriptionIconProps) {
  const styles = sizeStyles[size];
  const src = buildLogoImageUrl(domain, styles.px);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = src !== null && !failed;

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted font-medium text-muted-foreground ring-1 ring-inset ring-border',
        styles.box,
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          className="size-full object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{initialsFromName(name)}</span>
      )}
    </span>
  );
}
