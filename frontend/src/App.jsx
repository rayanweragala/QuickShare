import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/providers/ThemeProvider'
import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import SendPage from '@/pages/SendPage'
import ReceivePage from '@/pages/ReceivePage'
import RoomsPage from '@/pages/RoomsPage'
import CreateRoomPage from '@/pages/CreateRoomPage'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="quickshare-theme">
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="send" element={<SendPage />} />
              <Route path="receive" element={<ReceivePage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="rooms/create" element={<CreateRoomPage />} />
              {/* Add more routes as needed */}
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
