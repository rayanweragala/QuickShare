import * as React from 'react'
import { cn } from '@/lib/utils'

const Spinner = React.forwardRef(({ className, size = 'default', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    default: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'inline-block animate-spin rounded-full border-muted border-t-primary',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
})
Spinner.displayName = 'Spinner'

const SpinnerWithText = ({ text = 'Loading...', size = 'default' }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Spinner size={size} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

export { Spinner, SpinnerWithText }
