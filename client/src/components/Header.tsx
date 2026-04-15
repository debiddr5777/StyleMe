import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Sparkles, User, LogOut } from 'lucide-react'
import { useAuthStore, useUIStore } from '../store'

export default function Header() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-semibold gradient-text">StyleAI</span>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <User size={16} className="text-accent" />
                </div>
                <span className="hidden md:block text-sm">{user.name || user.email}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-surface transition-colors text-text-secondary hover:text-accent"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-secondary text-sm py-2">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}