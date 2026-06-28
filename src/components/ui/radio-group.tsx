'use client';

import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import * as React from 'react';

import { cn } from '@/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive>,
  RadioGroupPrimitive.Props
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive
    className={cn('grid w-full gap-3', className)}
    data-slot="radio-group"
    ref={ref}
    {...props}
  />
));
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioPrimitive.Root>,
  RadioPrimitive.Root.Props
>(({ className, ...props }, ref) => (
  <RadioPrimitive.Root
    className={cn(
      'group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:data-checked:bg-primary',
      className,
    )}
    data-slot="radio-group-item"
    ref={ref}
    {...props}
  >
    <RadioPrimitive.Indicator
      className="flex size-4 items-center justify-center"
      data-slot="radio-group-indicator"
    >
      <span className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-2 rounded-full bg-primary-foreground" />
    </RadioPrimitive.Indicator>
  </RadioPrimitive.Root>
));
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
