import { useState } from 'react'
import { ArrowLeft, Lock, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function CreateRoomPage() {
  const navigate = useNavigate()
  const [roomName, setRoomName] = useState('')
  const [roomIcon, setRoomIcon] = useState('📁')
  const [visibility, setVisibility] = useState('PUBLIC')

  const handleBack = () => {
    navigate('/rooms')
  }

  const handleCreate = () => {
    // Create room logic will be implemented
    console.log('Creating room:', { roomName, roomIcon, visibility })
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
          Back to Rooms
        </Button>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Create a Room</h1>
            <p className="text-muted-foreground">
              Set up a shared space for files
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
              <CardDescription>
                Customize your room settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input
                  id="room-name"
                  placeholder="My Project Files"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Room Icon</Label>
                <div className="text-4xl">{roomIcon}</div>
              </div>

              <div className="space-y-2">
                <Label>Visibility</Label>
                <Tabs value={visibility} onValueChange={setVisibility}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="PUBLIC" className="gap-2">
                      <Globe className="h-4 w-4" />
                      Public
                    </TabsTrigger>
                    <TabsTrigger value="PRIVATE" className="gap-2">
                      <Lock className="h-4 w-4" />
                      Private
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCreate}
                disabled={!roomName.trim()}
              >
                Create Room
              </Button>

              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Room creation will be fully functional soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
