'use client';

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator';
import * as React from 'react';

import { cn } from '@/utils';

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive>,
  SeparatorPrimitive.Props
>(({ className, orientation = 'horizontal', ...props }, ref) => (
  <SeparatorPrimitive
    className={cn(
      'shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch',
      className,
    )}
    data-slot="separator"
    orientation={orientation}
    ref={ref}
    {...props}
  />
));
Separator.displayName = 'Separator';

export { Separator };
