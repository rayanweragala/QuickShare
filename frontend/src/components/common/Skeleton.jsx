import clsx from 'clsx';

export const Skeleton = ({
  className = '',
  variant = 'default',
  width,
  height,
  circle = false,
  count = 1,
}) => {
  const baseStyles = "animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] rounded";

  const variantStyles = {
    default: 'h-4',
    text: 'h-4',
    title: 'h-8',
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-32',
    button: 'h-10',
  };

  const skeletonStyles = clsx(
    baseStyles,
    variantStyles[variant],
    {
      'rounded-full': circle,
    },
    className
  );

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  if (count > 1) {
    return (
      <div className="space-y-3" aria-label="Loading content">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={skeletonStyles} style={style} />
        ))}
      </div>
    );
  }

  return <div className={skeletonStyles} style={style} aria-label="Loading" />;
};

export const SkeletonCard = () => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4" aria-label="Loading card">
    <div className="flex items-center gap-3">
      <Skeleton variant="avatar" circle />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" />
        <Skeleton width="40%" />
      </div>
    </div>
    <Skeleton count={3} />
    <div className="flex gap-2">
      <Skeleton variant="button" width="100px" />
      <Skeleton variant="button" width="100px" />
    </div>
  </div>
);

export const SkeletonRoom = () => (
  <div
    className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-800 rounded-xl p-6 space-y-4"
    aria-label="Loading room"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton variant="avatar" circle />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" variant="title" />
          <Skeleton width="40%" />
        </div>
      </div>
    </div>
    <Skeleton count={2} />
    <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
      <Skeleton width="80px" />
      <Skeleton width="80px" />
      <Skeleton width="80px" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 3, variant = 'card' }) => {
  const Component = variant === 'room' ? SkeletonRoom : SkeletonCard;

  return (
    <div className="space-y-4" aria-label="Loading list">
      {Array.from({ length: count }).map((_, index) => (
        <Component key={index} />
      ))}
    </div>
  );
};
