import { classNames } from '~/utils/classNames';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Skeleton loading placeholder component.
 * Provides visual feedback while content is loading.
 */
export function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-bolt-elements-loader-background';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {};

  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }

  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return <div className={classNames(baseClasses, variantClasses[variant], className)} style={style} />;
}

/**
 * Skeleton text lines component for multi-line text placeholders.
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={classNames('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}
