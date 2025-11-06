import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/providers/ThemeProvider'

function Toaster({ ...props }) {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group-[.toaster]:bg-error group-[.toaster]:text-error-foreground group-[.toaster]:border-error',
          success: 'group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success',
          warning: 'group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground group-[.toaster]:border-warning',
          info: 'group-[.toaster]:bg-info group-[.toaster]:text-info-foreground group-[.toaster]:border-info',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
