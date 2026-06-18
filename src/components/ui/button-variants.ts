import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex select-none items-center justify-center rounded-md font-medium text-sm ring-offset-background transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-brand text-brand-foreground shadow-brand-sm hover:bg-brand-700 hover:shadow-brand active:shadow-brand-xs',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        'primary-2':
          'border border-[#448bf4] bg-[#136df4b8] text-primary-foreground transition duration-200 ease-out hover:bg-[#136df4a6]',
        'outline-2':
          'border border-[#448bf4] bg-[#136df41d] text-secondary-foreground transition duration-200 ease-out hover:bg-[#136df430]',
        'secondary-2':
          'bg-[#136df433] text-secondary-foreground transition duration-200 ease-out hover:bg-[#136df450]',
        outline:
          'border border-input bg-background shadow-brand-xs hover:border-brand-300 hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-[#ebeced]/70 text-secondary-foreground hover:bg-[#ebeced]',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        ghost_link:
          'underline-offset-4 hover:bg-accent hover:text-accent-foreground hover:underline',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
