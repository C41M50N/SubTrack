import {
  Content as AccordionPrimitiveContent,
  Header as AccordionPrimitiveHeader,
  Item as AccordionPrimitiveItem,
  Root as AccordionPrimitiveRoot,
  Trigger as AccordionPrimitiveTrigger,
} from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from 'react';

import { cn } from '@/utils';

const Accordion = AccordionPrimitiveRoot;

const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitiveItem>,
  ComponentPropsWithoutRef<typeof AccordionPrimitiveItem>
>(({ className, ...props }, ref) => (
  <AccordionPrimitiveItem className={cn(className)} ref={ref} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitiveTrigger>,
  ComponentPropsWithoutRef<typeof AccordionPrimitiveTrigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitiveHeader className="flex">
    <AccordionPrimitiveTrigger
      className={cn(
        'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitiveTrigger>
  </AccordionPrimitiveHeader>
));
AccordionTrigger.displayName = AccordionPrimitiveTrigger.displayName;

const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitiveContent>,
  ComponentPropsWithoutRef<typeof AccordionPrimitiveContent>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitiveContent
    className={cn(
      'overflow-hidden text-sm will-change-[height] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none',
      className,
    )}
    ref={ref}
    {...props}
  >
    <div className="pt-0 pb-1">{children}</div>
  </AccordionPrimitiveContent>
));
AccordionContent.displayName = AccordionPrimitiveContent.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
