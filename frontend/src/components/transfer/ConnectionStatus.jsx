import { useEffect, useState } from 'react'
import { Wifi, WifiOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function ConnectionStatus({
  connectionState = 'idle',
  isChannelReady = false,
  error = null
}) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (connectionState === 'connecting') {
      const interval = setInterval(() => {
        setPulse(prev => !prev)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [connectionState])

  const getConnectionInfo = () => {
    switch (connectionState) {
      case 'new':
        return {
          icon: <Wifi className="h-4 w-4" />,
          label: 'Initializing',
          color: 'bg-muted text-muted-foreground',
          description: 'Setting up connection...'
        }
      case 'connecting':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          label: 'Connecting',
          color: 'bg-warning/20 text-warning border-warning/20',
          description: 'Establishing peer connection...'
        }
      case 'connected':
        return {
          icon: isChannelReady ? <CheckCircle2 className="h-4 w-4" /> : <Wifi className="h-4 w-4" />,
          label: isChannelReady ? 'Ready' : 'Connected',
          color: isChannelReady ? 'bg-success/20 text-success border-success/20' : 'bg-info/20 text-info border-info/20',
          description: isChannelReady ? 'Ready to transfer files' : 'Finalizing connection...'
        }
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          label: 'Disconnected',
          color: 'bg-error/20 text-error border-error/20',
          description: 'Connection lost'
        }
      case 'failed':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Failed',
          color: 'bg-error/20 text-error border-error/20',
          description: 'Connection failed'
        }
      case 'closed':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          label: 'Closed',
          color: 'bg-muted text-muted-foreground',
          description: 'Connection closed'
        }
      default:
        return {
          icon: <Wifi className="h-4 w-4" />,
          label: 'Idle',
          color: 'bg-muted text-muted-foreground',
          description: 'Not connected'
        }
    }
  }

  const info = getConnectionInfo()

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full transition-all',
              pulse && connectionState === 'connecting' && 'animate-pulse-ring'
            )}>
              {info.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{info.label}</span>
                <Badge
                  variant="outline"
                  className={cn('text-xs', info.color)}
                >
                  {connectionState}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {error || info.description}
              </p>
            </div>
          </div>

          {/* Visual indicator */}
          <div className="flex items-center gap-1">
            <div className={cn(
              'h-2 w-2 rounded-full transition-all',
              connectionState === 'connected' && isChannelReady && 'bg-success animate-pulse',
              connectionState === 'connecting' && 'bg-warning animate-pulse',
              (connectionState === 'disconnected' || connectionState === 'failed') && 'bg-error',
              connectionState === 'idle' && 'bg-muted-foreground'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
