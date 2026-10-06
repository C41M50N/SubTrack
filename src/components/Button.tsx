import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'outline';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const baseClasses = 'enabled:cursor-pointer';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60',
  outline: 'rounded-md border border-black/10 px-4 py-2 text-sm font-medium',
};

export function Button({
  variant = 'default',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [baseClasses, variantClasses[variant], className]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...props} />;
}
