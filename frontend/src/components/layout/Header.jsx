import { Link, useNavigate } from 'react-router-dom'
import { MoonIcon, SunIcon, MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/providers/ThemeProvider'
import useAppStore from '@/store/useAppStore'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { toggleSidebar, isMobile } = useAppStore()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-full flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          )}

          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg opacity-20 blur-sm" />
              <div className="relative bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">
              QuickShare
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/send')}
            >
              Send
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/receive')}
            >
              Receive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/rooms')}
            >
              Rooms
            </Button>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu (for future auth) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
                  ?
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/about')}>
                About
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Sign In (Coming Soon)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
