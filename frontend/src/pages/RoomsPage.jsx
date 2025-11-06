import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function RoomsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container-full py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Rooms</h1>
            <p className="text-muted-foreground">
              Browse and join shared file rooms
            </p>
          </div>

          <Button onClick={() => navigate('/rooms/create')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Room
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="public" className="space-y-6">
          <TabsList>
            <TabsTrigger value="public">Public Rooms</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="my-rooms">My Rooms</TabsTrigger>
          </TabsList>

          <TabsContent value="public">
            <Card>
              <CardHeader>
                <CardTitle>Public Rooms</CardTitle>
                <CardDescription>
                  This feature is being migrated to v2
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Room browsing will be available soon with improved UI/UX
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured">
            <Card>
              <CardHeader>
                <CardTitle>Featured Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No featured rooms yet
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-rooms">
            <Card>
              <CardHeader>
                <CardTitle>My Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    You haven't created any rooms yet
                  </p>
                  <Button onClick={() => navigate('/rooms/create')} className="mt-4">
                    Create Your First Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
