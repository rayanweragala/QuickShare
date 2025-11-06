import { CheckCircle2, FileIcon, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function TransferProgress({
  fileName,
  fileSize,
  progress,
  currentChunk,
  totalChunks,
  status = 'transferring', // 'waiting' | 'transferring' | 'complete' | 'error'
  error,
  onCancel,
  onRetry,
  transferSpeed,
  estimatedTime
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'complete':
        return 'text-success'
      case 'error':
        return 'text-error'
      case 'transferring':
        return 'text-primary'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-success" />
      case 'error':
        return <XCircle className="h-5 w-5 text-error" />
      case 'transferring':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      default:
        return <FileIcon className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'complete':
        return 'Transfer Complete'
      case 'error':
        return 'Transfer Failed'
      case 'transferring':
        return 'Transferring...'
      case 'waiting':
        return 'Waiting to start...'
      default:
        return 'Unknown status'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">File Transfer</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={cn('text-sm font-medium', getStatusColor())}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="p-2 bg-background rounded">
            <FileIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{fileName}</p>
            {fileSize && (
              <p className="text-sm text-muted-foreground">
                {formatBytes(fileSize)}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {status === 'transferring' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />

            {/* Chunk Progress */}
            {totalChunks > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Chunk {currentChunk} of {totalChunks}</span>
                {transferSpeed && (
                  <Badge variant="secondary" className="text-xs">
                    {transferSpeed}
                  </Badge>
                )}
              </div>
            )}

            {/* Estimated Time */}
            {estimatedTime && (
              <p className="text-xs text-muted-foreground text-center">
                Estimated time remaining: {estimatedTime}
              </p>
            )}
          </div>
        )}

        {/* Complete State */}
        {status === 'complete' && (
          <div className="py-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              File transferred successfully!
            </p>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && error && (
          <div className="py-4">
            <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
              <XCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-error mb-1">
                  Transfer Failed
                </p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {status === 'transferring' && onCancel && (
            <Button
              variant="destructive"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel Transfer
            </Button>
          )}
          {status === 'error' && onRetry && (
            <Button
              variant="default"
              onClick={onRetry}
              className="flex-1"
            >
              Retry Transfer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
