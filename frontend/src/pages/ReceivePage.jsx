import { useState, useEffect } from 'react'
import { ArrowLeft, Download, CheckCircle2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useSession } from '../hooks/useSession'
import { useWebRTC } from '../hooks/useWebRTC'
import { useFileTransfer } from '../hooks/useFileTransfer'
import ConnectionStatus from '@/components/transfer/ConnectionStatus'
import TransferProgress from '@/components/transfer/TransferProgress'
import { SpinnerWithText } from '@/components/ui/spinner'
import useSessionStore from '@/store/useSessionStore'
import { formatBytes } from '@/lib/utils'

export default function ReceivePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sessionCode, setSessionCode] = useState(searchParams.get('code') || '')
  const [step, setStep] = useState('input') // 'input' | 'connecting' | 'receiving' | 'complete'

  // Hooks
  const {
    session,
    isLoading: sessionLoading,
    error: sessionError,
    isConnected: socketConnected,
    joinSession,
    endSession,
  } = useSession()

  const {
    connectionState,
    isChannelReady,
    error: webrtcError,
    initializeConnection,
  } = useWebRTC(false, false)

  const {
    isReceiving,
    progress,
    currentChunk,
    totalChunks,
    fileName,
    error: transferError,
    transferComplete,
    receivedFiles,
    downloadReceivedFile,
    resetTransfer,
  } = useFileTransfer()

  // Zustand store
  const setSessionData = useSessionStore(state => state.setSession)
  const setConnectionState = useSessionStore(state => state.setConnectionState)

  useEffect(() => {
    // Update zustand store
    if (session) {
      setSessionData({
        sessionId: session.sessionId,
        sessionCode: session.sessionCode,
        role: 'receiver',
      })
    }
  }, [session, setSessionData])

  useEffect(() => {
    setConnectionState(connectionState)
  }, [connectionState, setConnectionState])

  // Auto-join if code is in URL
  useEffect(() => {
    const code = searchParams.get('code')
    if (code && code.length === 6 && step === 'input') {
      setSessionCode(code)
      handleJoinSession(code)
    }
  }, [searchParams])

  // Handle file reception
  useEffect(() => {
    if (isReceiving) {
      setStep('receiving')
    }
    if (transferComplete && receivedFiles.length > 0) {
      setStep('complete')
    }
  }, [isReceiving, transferComplete, receivedFiles])

  const handleJoinSession = async (code = sessionCode) => {
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit session code')
      return
    }

    try {
      setStep('connecting')
      const joinedSession = await joinSession(code)

      if (joinedSession) {
        toast.success('Joined session successfully!')

        // Initialize WebRTC
        await initializeConnection()

        toast.info('Waiting for sender to connect...')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to join session')
      setStep('input')
    }
  }

  const handleBack = async () => {
    if (session) {
      await endSession()
    }
    resetTransfer()
    navigate('/')
  }

  const handleDownloadFile = (index) => {
    downloadReceivedFile(index)
    toast.success('File downloaded!')
  }

  const handleReceiveMore = async () => {
    resetTransfer()
    setStep('connecting')
  }

  // Loading state
  if (sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <SpinnerWithText text="Joining session..." />
      </div>
    )
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
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Receive Files</h1>
            <p className="text-muted-foreground">
              Enter a session code to receive files
            </p>
          </div>

          {/* Input Step */}
          {step === 'input' && (
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
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Ask the sender for their session code
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleJoinSession()}
                  disabled={sessionCode.length !== 6}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Join Session
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Connecting Step */}
          {step === 'connecting' && session && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Connected to Session</CardTitle>
                  <CardDescription>
                    Session code: <code className="font-mono">{session.sessionCode}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Waiting for sender to start transfer...
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Connection Status */}
              <ConnectionStatus
                connectionState={connectionState}
                isChannelReady={isChannelReady}
                error={webrtcError || sessionError}
              />
            </>
          )}

          {/* Receiving Step */}
          {step === 'receiving' && (
            <>
              <TransferProgress
                fileName={fileName}
                progress={progress}
                currentChunk={currentChunk}
                totalChunks={totalChunks}
                status="transferring"
                error={transferError}
              />

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Files will be automatically saved when the transfer completes
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Complete Step */}
          {step === 'complete' && receivedFiles.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                    <div>
                      <CardTitle>Files Received!</CardTitle>
                      <CardDescription>
                        {receivedFiles.length} file(s) ready to download
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Files List */}
                  <div className="space-y-2">
                    {receivedFiles.map((file, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {file.metadata.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatBytes(file.metadata.size)}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleDownloadFile(index)}
                              size="sm"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={handleReceiveMore}
                    >
                      Receive More Files
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Error Display */}
          {(sessionError || webrtcError || transferError) && (
            <Card className="border-error">
              <CardContent className="pt-6">
                <p className="text-sm text-error">
                  {sessionError || webrtcError || transferError}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
