import { Outlet } from 'react-router-dom'
import Header from './Header'
import { Toaster } from '@/components/ui/toaster'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
