import clsx from 'clsx';

export const StatusBadge = ({
  status,
  showDot = true,
  size = 'default',
}) => {
  const statusConfig = {
    waiting: {
      label: 'Waiting',
      variant: 'warning',
      dotColor: 'status-dot-warning',
    },
    connected: {
      label: 'Connected',
      variant: 'success',
      dotColor: 'status-dot-success',
    },
    transferring: {
      label: 'Transferring',
      variant: 'info',
      dotColor: 'status-dot-success',
    },
    completed: {
      label: 'Completed',
      variant: 'success',
      dotColor: 'status-dot-success',
    },
    error: {
      label: 'Error',
      variant: 'error',
      dotColor: 'status-dot-error',
    },
    disconnected: {
      label: 'Disconnected',
      variant: 'neutral',
      dotColor: 'status-dot-error',
    },
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.waiting;

  const badgeStyles = clsx('badge', {
    'badge-success': config.variant === 'success',
    'badge-warning': config.variant === 'warning',
    'badge-error': config.variant === 'error',
    'badge-info': config.variant === 'info',
    'badge-neutral': config.variant === 'neutral',
  });

  return (
    <span className={badgeStyles}>
      {showDot && (
        <span className={clsx('status-dot', config.dotColor)} />
      )}
      {config.label}
    </span>
  );
};