'use client';

import { IconArrowRight, IconDashboard } from '@tabler/icons-react';
import Link from 'next/link';

import { Button, type ButtonProps } from '@/components/ui/button';
import { useSession } from '@/features/auth/auth-client';

type LandingActionProps = {
  authenticatedLabel?: string;
  className?: string;
  label?: string;
  showIcon?: boolean;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
};

export function LandingPrimaryAction({
  authenticatedLabel = 'Open Dashboard',
  className,
  label = 'Start Tracking',
  showIcon = true,
  size = 'lg',
  variant = 'default',
}: LandingActionProps) {
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session);
  const Icon = isAuthenticated ? IconDashboard : IconArrowRight;

  return (
    <Button asChild className={className} size={size} variant={variant}>
      <Link href={isAuthenticated ? '/dashboard' : '/auth/signup'}>
        {isAuthenticated ? authenticatedLabel : label}
        {showIcon && <Icon className="ml-2 h-4 w-4" />}
      </Link>
    </Button>
  );
}
