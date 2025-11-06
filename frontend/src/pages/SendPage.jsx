import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Send as SendIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useSession } from '../hooks/useSession'
import { useWebRTC } from '../hooks/useWebRTC'
import { useFileTransfer } from '../hooks/useFileTransfer'
import FileUploadZone from '@/components/transfer/FileUploadZone'
import TransferProgress from '@/components/transfer/TransferProgress'
import ConnectionStatus from '@/components/transfer/ConnectionStatus'
import SessionCodeDisplay from '@/components/session/SessionCodeDisplay'
import { SpinnerWithText } from '@/components/ui/spinner'
import useSessionStore from '@/store/useSessionStore'

export default function SendPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('single') // 'single' | 'broadcast'
  const [selectedFiles, setSelectedFiles] = useState([])
  const [step, setStep] = useState('setup') // 'setup' | 'waiting' | 'transferring'

  // Hooks
  const {
    session,
    isLoading: sessionLoading,
    error: sessionError,
    isConnected: socketConnected,
    createSession,
    createBroadcastSession,
    endSession,
  } = useSession()

  const {
    connectionState,
    isChannelReady,
    error: webrtcError,
    initializeConnection,
    createAndSendOffer,
  } = useWebRTC(true, mode === 'broadcast')

  const {
    isSending,
    progress,
    currentChunk,
    totalChunks,
    fileName,
    error: transferError,
    transferComplete,
    sendFile,
    cancelTransfer,
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
        role: 'sender',
      })
    }
  }, [session, setSessionData])

  useEffect(() => {
    setConnectionState(connectionState)
  }, [connectionState, setConnectionState])

  const handleCreateSession = async () => {
    try {
      const newSession = mode === 'broadcast'
        ? await createBroadcastSession()
        : await createSession()

      if (newSession) {
        toast.success('Session created successfully!')
        setStep('waiting')

        // Initialize WebRTC
        await initializeConnection()
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create session')
    }
  }

  const handleSendFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    if (!isChannelReady) {
      toast.error('Connection not ready. Please wait...')
      return
    }

    try {
      setStep('transferring')

      for (const file of selectedFiles) {
        await sendFile(file)
        toast.success(`${file.name} sent successfully!`)
      }

      toast.success('All files transferred!')
    } catch (err) {
      toast.error(err.message || 'Transfer failed')
    }
  }

  const handleBack = async () => {
    if (session) {
      await endSession()
    }
    resetTransfer()
    navigate('/')
  }

  const handleStartOver = async () => {
    await endSession()
    resetTransfer()
    setSelectedFiles([])
    setStep('setup')
  }

  // Loading state
  if (sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <SpinnerWithText text="Creating session..." />
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

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Send Files</h1>
            <p className="text-muted-foreground">
              Share files instantly with anyone
            </p>
          </div>

          {/* Setup Step */}
          {step === 'setup' && (
            <>
              {/* Mode Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Choose Transfer Mode</CardTitle>
                  <CardDescription>
                    Select how you want to share your files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={mode} onValueChange={setMode}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="single" className="gap-2">
                        <Users className="h-4 w-4" />
                        One-to-One
                      </TabsTrigger>
                      <TabsTrigger value="broadcast" className="gap-2" disabled>
                        <Users className="h-4 w-4" />
                        Broadcast
                        <span className="text-xs ml-1">(Soon)</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="single" className="mt-4 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Send files to a single recipient in a private peer-to-peer connection.
                      </p>
                    </TabsContent>

                    <TabsContent value="broadcast" className="mt-4 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Send files to multiple recipients simultaneously.
                      </p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* File Selection */}
              <FileUploadZone
                onFilesSelected={setSelectedFiles}
                maxFiles={mode === 'broadcast' ? 5 : 10}
              />

              {/* Start Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleCreateSession}
                disabled={selectedFiles.length === 0}
              >
                <SendIcon className="h-5 w-5 mr-2" />
                Create Session & Start Sharing
              </Button>
            </>
          )}

          {/* Waiting Step */}
          {step === 'waiting' && session && (
            <>
              {/* Session Code */}
              <SessionCodeDisplay
                sessionCode={session.sessionCode}
                sessionId={session.sessionId}
                title="Share this code"
                description="Give this code to the recipient to start transferring files"
              />

              {/* Connection Status */}
              <ConnectionStatus
                connectionState={connectionState}
                isChannelReady={isChannelReady}
                error={webrtcError || sessionError}
              />

              {/* Selected Files Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Files Ready to Send</CardTitle>
                  <CardDescription>
                    {selectedFiles.length} file(s) selected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <span className="font-medium truncate">{file.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Send Button */}
              <div className="flex gap-2">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleSendFiles}
                  disabled={!isChannelReady}
                >
                  <SendIcon className="h-5 w-5 mr-2" />
                  {isChannelReady ? 'Send Files' : 'Waiting for Connection...'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleStartOver}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          {/* Transferring Step */}
          {step === 'transferring' && (
            <>
              <TransferProgress
                fileName={fileName}
                fileSize={selectedFiles.find(f => f.name === fileName)?.size}
                progress={progress}
                currentChunk={currentChunk}
                totalChunks={totalChunks}
                status={isSending ? 'transferring' : transferComplete ? 'complete' : 'error'}
                error={transferError}
                onCancel={cancelTransfer}
                onRetry={handleSendFiles}
              />

              {transferComplete && (
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={handleStartOver}
                  >
                    Send More Files
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Done
                  </Button>
                </div>
              )}
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
