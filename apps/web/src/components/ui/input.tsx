import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground/80">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-surface px-3 py-2 text-sm',
            'transition-colors duration-150',
            'placeholder:text-muted-foreground/60',
            'hover:border-foreground/20',
            'focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring/40',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input',
            error && 'border-destructive focus:ring-destructive/20 focus:border-destructive/40',
            icon && 'pl-10',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  ),
);

Input.displayName = 'Input';
