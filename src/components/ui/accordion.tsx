import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';

import { cn } from '@/lib/utils';

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn('flex w-full flex-col', className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('not-last:border-b', className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'group/accordion-trigger relative flex flex-1 items-start justify-between rounded-md border border-transparent py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground',
          className,
        )}
        {...props}
      >
        {children}
        {/* A plus whose vertical bar turns flat into a minus while open. */}
        <span
          data-slot="accordion-trigger-icon"
          aria-hidden
          className="pointer-events-none relative shrink-0"
        >
          <span className="absolute inset-0 m-auto h-[1.5px] w-3 rounded-full bg-current" />
          <span className="absolute inset-0 m-auto h-[1.5px] w-3 rotate-90 rounded-full bg-current transition-[rotate] duration-200 ease-reveal group-data-panel-open/accordion-trigger:rotate-180 motion-reduce:transition-none" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="group/accordion-panel overflow-hidden text-sm ease-reveal motion-safe:data-open:animate-accordion-down motion-safe:data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          // The answer fades in just after the panel starts to open, and out
          // quickly as it starts to close.
          'h-(--accordion-panel-height) pt-0 pb-4 transition-opacity delay-50 duration-150 ease-reveal group-data-starting-style/accordion-panel:opacity-0 group-data-ending-style/accordion-panel:opacity-0 group-data-ending-style/accordion-panel:delay-0 group-data-ending-style/accordion-panel:duration-100 data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
