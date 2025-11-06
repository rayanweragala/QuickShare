import { useState } from 'react'
import { ArrowLeft, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ReceivePage() {
  const navigate = useNavigate()
  const [sessionCode, setSessionCode] = useState('')

  const handleBack = () => {
    navigate('/')
  }

  const handleJoin = () => {
    // Join session logic will be implemented
    console.log('Joining session:', sessionCode)
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

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Receive Files</h1>
            <p className="text-muted-foreground">
              Enter a session code to receive files
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Join Session</CardTitle>
              <CardDescription>
                Enter the 6-digit code provided by the sender
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-code">Session Code</Label>
                <Input
                  id="session-code"
                  placeholder="ABC123"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-wider"
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleJoin}
                disabled={sessionCode.length !== 6}
              >
                <Download className="h-5 w-5 mr-2" />
                Join Session
              </Button>

              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  The receive functionality will be available soon with improved UI/UX
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
