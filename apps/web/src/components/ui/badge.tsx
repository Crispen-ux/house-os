import { cn } from '@/lib/utils';
import { getStatusColor } from '@/lib/utils';

interface BadgeProps {
  className?: string;
  variant?: string;
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({ className, variant, children, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
      variant ? getStatusColor(variant) : 'bg-secondary text-secondary-foreground border-transparent',
      className,
    )}>
      {dot && (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'PENDING' && 'bg-amber-500',
          variant === 'COMPLETED' && 'bg-emerald-500',
          variant === 'OVERDUE' && 'bg-red-500',
          variant === 'SKIPPED' && 'bg-red-400',
          variant === 'ACCEPTED' && 'bg-emerald-500',
          variant === 'DECLINED' && 'bg-red-500',
          variant === 'CANCELLED' && 'bg-gray-400',
          !variant && 'bg-muted-foreground',
        )} />
      )}
      {children}
    </span>
  );
}
