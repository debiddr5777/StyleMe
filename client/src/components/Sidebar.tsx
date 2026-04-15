import { NavLink } from 'react-router-dom'
import { Home, Shirt, Sparkles, Heart, ShoppingBag, User, Plus } from 'lucide-react'
import { useUIStore } from '../store'

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/wardrobe', icon: Shirt, label: 'Wardrobe' },
  { path: '/recommendations', icon: Sparkles, label: 'Recommendations' },
  { path: '/outfits', icon: Heart, label: 'Outfits' },
  { path: '/shopping', icon: ShoppingBag, label: 'Shopping' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 w-64 bg-surface/50 backdrop-blur-xl border-r border-border transition-all duration-300 z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full p-4">
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="pt-4 border-t border-border">
          <NavLink
            to="/wardrobe/add"
            className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors"
          >
            <Plus size={20} />
            <span className="font-medium">Add Item</span>
          </NavLink>
        </div>
      </div>
    </aside>
  )
}