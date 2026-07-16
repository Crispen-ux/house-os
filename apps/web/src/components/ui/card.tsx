import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}

export function Card({ className, children, hover }: CardProps) {
  return (
    <div className={cn(
      'rounded-xl border bg-card text-card-foreground shadow-card transition-all duration-200',
      hover && 'hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer',
      className,
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('flex flex-col space-y-1.5 px-6 pt-6 pb-2', className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h3 className={cn('font-semibold text-base leading-none tracking-tight', className)}>{children}</h3>;
}

export function CardDescription({ className, children }: CardProps) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn('px-6 pb-6 pt-2', className)}>{children}</div>;
}

export function CardFooter({ className, children }: CardProps) {
  return <div className={cn('flex items-center px-6 pb-6 pt-2', className)}>{children}</div>;
}
