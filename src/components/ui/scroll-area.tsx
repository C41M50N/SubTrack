'use client';

import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';

import { cn } from '@/lib/utils';

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      // The viewport is sized by flexbox rather than `h-full`, so the root does
      // not need a computed height for a percentage to resolve against. That
      // matters when an ancestor is only constrained by `max-height`, which
      // leaves `height` computing to `auto` and would collapse the percentage.
      // `overflow-hidden` is a backstop: the absolutely positioned scrollbars
      // sit inside the padding box, so it clips overflowing content only.
      className={cn('relative flex flex-col overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="w-full min-h-0 flex-1 rounded-[inherit] outline-none focus-visible:inset-ring-2 focus-visible:inset-ring-ring/50"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      orientation={orientation}
      data-slot="scroll-area-scrollbar"
      className={cn(
        // Track padding keeps the thumb clear of rounded container corners, and
        // is measured by the primitive when sizing and dragging the thumb.
        'group/scrollbar flex touch-none select-none',
        'data-[orientation=vertical]:w-2 data-[orientation=vertical]:px-px data-[orientation=vertical]:py-1',
        'data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:px-1 data-[orientation=horizontal]:py-px',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        // Stays faintly visible at rest so a clipped list still reads as
        // clipped, then strengthens while the pointer is anywhere over the
        // scroll area or the user is actively scrolling.
        className={cn(
          'relative flex-1 rounded-full bg-foreground/10 transition-colors duration-200',
          'group-data-hovering/scrollbar:bg-foreground/25 group-data-scrolling/scrollbar:bg-foreground/25',
          'hover:bg-foreground/35 active:bg-foreground/45',
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
