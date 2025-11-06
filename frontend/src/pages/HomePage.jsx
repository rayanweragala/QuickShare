import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send,
  Download,
  Users,
  Plus,
  Search,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useRoomStore from '@/store/useRoomStore'
import useAppStore from '@/store/useAppStore'

export default function HomePage() {
  const navigate = useNavigate()
  const { publicRooms, featuredRooms } = useRoomStore()
  const { stats } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSendFiles = () => {
    navigate('/send')
  }

  const handleReceiveFiles = () => {
    navigate('/receive')
  }

  const handleCreateRoom = () => {
    navigate('/rooms/create')
  }

  const handleJoinRoom = (roomCode) => {
    navigate(`/rooms/${roomCode}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 mesh-gradient">
        <div className="container-full">
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Share Files <span className="text-gradient">Instantly</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fast, secure, and easy peer-to-peer file sharing. No sign-up required.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4 justify-center pt-8">
              <Button size="xl" onClick={handleSendFiles} className="gap-2">
                <Send className="h-5 w-5" />
                Send Files
              </Button>
              <Button size="xl" variant="secondary" onClick={handleReceiveFiles} className="gap-2">
                <Download className="h-5 w-5" />
                Receive Files
              </Button>
              <Button size="xl" variant="outline" onClick={handleCreateRoom} className="gap-2">
                <Plus className="h-5 w-5" />
                Create Room
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-4xl mx-auto">
              <StatsCard
                icon={FileText}
                value={stats.totalFilesShared.toLocaleString()}
                label="Files Shared"
              />
              <StatsCard
                icon={Users}
                value={stats.sessionsCompleted.toLocaleString()}
                label="Sessions"
              />
              <StatsCard
                icon={TrendingUp}
                value={formatBytes(stats.totalBytesTransferred)}
                label="Data Transferred"
              />
              <StatsCard
                icon={Users}
                value={stats.roomsCreated.toLocaleString()}
                label="Rooms Created"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      {featuredRooms.length > 0 && (
        <section className="py-12 border-t border-border">
          <div className="container-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Your Featured Rooms</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRooms.map((room) => (
                <RoomCard key={room.roomId} room={room} onJoin={handleJoinRoom} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Public Rooms */}
      <section className="py-12">
        <div className="container-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-3xl font-bold">Public Rooms</h2>
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Tabs defaultValue="recent" className="space-y-6">
            <TabsList>
              <TabsTrigger value="recent">
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="popular">
                <TrendingUp className="h-4 w-4 mr-2" />
                Popular
              </TabsTrigger>
              <TabsTrigger value="active">
                <Users className="h-4 w-4 mr-2" />
                Most Active
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-6">
              <RoomGrid rooms={publicRooms} onJoinRoom={handleJoinRoom} searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="popular" className="space-y-6">
              <RoomGrid rooms={publicRooms} onJoinRoom={handleJoinRoom} searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="active" className="space-y-6">
              <RoomGrid rooms={publicRooms} onJoinRoom={handleJoinRoom} searchQuery={searchQuery} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-full">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose QuickShare?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Fast & Secure"
              description="Peer-to-peer connections with end-to-end encryption. Your files never touch our servers."
            />
            <FeatureCard
              title="No Limits"
              description="Share files of any size. No artificial restrictions on file transfers."
            />
            <FeatureCard
              title="Easy to Use"
              description="Simple interface, no sign-up required. Just share and go."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function StatsCard({ icon: Icon, value, label }) {
  return (
    <Card className="text-center">
      <CardContent className="pt-6">
        <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

function RoomCard({ room, onJoin }) {
  return (
    <Card className="card-hover cursor-pointer" onClick={() => onJoin(room.roomCode)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{room.roomIcon || '📁'}</div>
            <div>
              <CardTitle className="text-lg">{room.roomName}</CardTitle>
              <CardDescription className="text-xs">by {room.creatorAnimalName}</CardDescription>
            </div>
          </div>
          {room.featured && <Badge variant="secondary">Featured</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              {room.participantCount || 0}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-4 w-4" />
              {room.fileCount || 0}
            </span>
          </div>
          <code className="text-xs bg-muted px-2 py-1 rounded">{room.roomCode}</code>
        </div>
      </CardContent>
    </Card>
  )
}

function RoomGrid({ rooms, onJoinRoom, searchQuery }) {
  const filteredRooms = rooms.filter(room =>
    room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.roomCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No rooms found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredRooms.map((room) => (
        <RoomCard key={room.roomId} room={room} onJoin={onJoinRoom} />
      ))}
    </div>
  )
}

function FeatureCard({ title, description }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
