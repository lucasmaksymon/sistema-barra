import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton = ({
  variant = 'rectangular',
  width,
  height,
  count = 1,
  className = '',
  style,
  ...props
}: SkeletonProps) => {
  const variantClasses = {
    text: 'skeleton skeleton-text',
    rectangular: 'skeleton',
    circular: 'skeleton skeleton-circle',
  };
  
  const skeletonStyle = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    ...style,
  };
  
  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${variantClasses[variant]} ${className}`}
            style={skeletonStyle}
            {...props}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      style={skeletonStyle}
      {...props}
    />
  );
};

// Skeletons predefinidos para componentes comunes
export const CardSkeleton = () => {
  return (
    <div className="card p-6">
      <Skeleton variant="text" width="60%" height={24} className="mb-4" />
      <Skeleton variant="text" count={3} />
      <div className="mt-4 flex gap-2">
        <Skeleton width={80} height={32} />
        <Skeleton width={80} height={32} />
      </div>
    </div>
  );
};

export const ProductCardSkeleton = () => {
  return (
    <div className="card p-4">
      <Skeleton variant="rectangular" height={120} className="mb-3" />
      <Skeleton variant="text" width="80%" className="mb-2" />
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="rectangular" height={36} className="mt-4" />
    </div>
  );
};

export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  );
};

export const ListSkeleton = ({ items = 5 }: { items?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1">
            <Skeleton variant="text" width="70%" className="mb-2" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
};
