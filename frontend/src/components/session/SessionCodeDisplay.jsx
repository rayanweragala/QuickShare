import { useState } from 'react'
import { Copy, Check, QrCode as QrCodeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { copyToClipboard } from '@/lib/utils'

export default function SessionCodeDisplay({ sessionCode, sessionId, title, description }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(sessionCode)
    if (success) {
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy code')
    }
  }

  const shareUrl = `${window.location.origin}/receive?code=${sessionCode}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Session Code'}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Code */}
        <div className="flex items-center justify-center">
          <div className="session-code">
            {sessionCode}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <QrCodeIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG
                    value={shareUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan this code to join the session
                </p>
                <code className="text-xs bg-muted px-3 py-2 rounded">
                  {sessionCode}
                </code>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Share URL */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Or share this link:</p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded truncate">
              {shareUrl}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                const success = await copyToClipboard(shareUrl)
                if (success) {
                  toast.success('Link copied!')
                }
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
