import { Text as RE_Text } from '@react-email/components';
import type React from 'react';
import { cn } from '@/utils';

type TextProps = {
  className?: string;
  children: React.ReactNode;
};

export function Text({ className, children }: TextProps) {
  return <RE_Text className={cn('m-0', className)}>{children}</RE_Text>;
}
