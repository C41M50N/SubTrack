import * as React from 'react';

import { cn } from '@/utils';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<'label'>
>(({ className, htmlFor, ...props }, ref) => (
  <label
    className={cn(
      'flex items-center gap-2 font-medium text-sm leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      className,
    )}
    data-slot="label"
    htmlFor={htmlFor}
    ref={ref}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
