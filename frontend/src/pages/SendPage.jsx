import { useState } from 'react'
import { ArrowLeft, Copy, QrCode, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import useSessionStore from '@/store/useSessionStore'
import { copyToClipboard } from '@/lib/utils'

export default function SendPage() {
  const navigate = useNavigate()
  const { sessionId, sessionCode, isActive } = useSessionStore()
  const [mode, setMode] = useState('single') // 'single' | 'broadcast'

  const handleBack = () => {
    navigate('/')
  }

  const handleCopyCode = async () => {
    if (sessionCode) {
      const success = await copyToClipboard(sessionCode)
      if (success) {
        toast.success('Session code copied to clipboard!')
      } else {
        toast.error('Failed to copy code')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container-full py-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Send Files</h1>
            <p className="text-muted-foreground">
              Share files instantly with anyone
            </p>
          </div>

          {/* Mode Selection */}
          {!isActive && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Transfer Mode</CardTitle>
                <CardDescription>
                  Select how you want to share your files
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <Button
                  variant={mode === 'single' ? 'default' : 'outline'}
                  className="h-auto flex-col items-start gap-2 p-6"
                  onClick={() => setMode('single')}
                >
                  <Users className="h-8 w-8" />
                  <div className="text-left">
                    <div className="font-semibold">One-to-One</div>
                    <div className="text-sm text-muted-foreground">
                      Share with a single recipient
                    </div>
                  </div>
                </Button>

                <Button
                  variant={mode === 'broadcast' ? 'default' : 'outline'}
                  className="h-auto flex-col items-start gap-2 p-6"
                  onClick={() => setMode('broadcast')}
                >
                  <Users className="h-8 w-8" />
                  <div className="text-left">
                    <div className="font-semibold">Broadcast</div>
                    <div className="text-sm text-muted-foreground">
                      Share with multiple recipients
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Session Info - Placeholder for now */}
          <Card>
            <CardHeader>
              <CardTitle>Session Setup</CardTitle>
              <CardDescription>
                This feature is being migrated to v2. Please check back soon!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  The send functionality will be available soon with improved UI/UX
                </p>
                <Button onClick={handleBack}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
