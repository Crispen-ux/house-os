import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  lines?: number;
  className?: string;
  hasImage?: boolean;
}

export function SkeletonCard({ lines = 3, className, hasImage }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 shadow-card', className)}>
      <div className="flex items-start gap-4">
        {hasImage && <div className="h-12 w-12 rounded-xl animate-shimmer shrink-0" />}
        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-3 rounded-full animate-shimmer',
                i === 0 ? 'w-2/3' : i === 1 ? 'w-1/2' : 'w-1/3',
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded-full animate-shimmer" />
          <div className="h-7 w-12 rounded-full animate-shimmer" style={{ animationDelay: '0.1s' }} />
        </div>
        <div className="h-10 w-10 rounded-xl animate-shimmer" style={{ animationDelay: '0.05s' }} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg animate-shimmer shrink-0" style={{ animationDelay: `${i * 0.05}s` }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded-full animate-shimmer" style={{ animationDelay: `${i * 0.05}s` }} />
            <div className="h-2.5 w-1/3 rounded-full animate-shimmer" style={{ animationDelay: `${i * 0.05 + 0.05}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
