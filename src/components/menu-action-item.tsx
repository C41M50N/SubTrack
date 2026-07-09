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
            ? 'bg-red-100 ring-red-300'
            : 'bg-neutral-100 ring-neutral-300',
        )}
      >
        <Icon className="p-1 size-4.5 stroke-3" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
