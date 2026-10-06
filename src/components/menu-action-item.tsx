import { cn } from '@/lib/utils';

type MenuActionItemProps = {
  className?: string;
  variant?: 'default' | 'destructive';
  icon: React.ElementType;
  label: string;
};

export function MenuActionItem({
  className,
  icon: Icon,
  label,
  variant = 'default',
}: MenuActionItemProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'ring-1 rounded-md',
          variant === 'destructive'
            ? 'bg-chip-destructive ring-chip-destructive-border'
            : 'bg-chip ring-chip-border',
        )}
      >
        <Icon className="p-1 size-4.5 stroke-3" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
