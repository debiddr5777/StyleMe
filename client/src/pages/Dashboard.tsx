import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shirt, Sparkles, Heart, Plus, RefreshCw } from 'lucide-react'
import { wardrobeApi, outfitApi, recommendationApi } from '../utils/api'
import { useUIStore } from '../store'

export default function Dashboard() {
  const addToast = useUIStore((state) => state.addToast)
  const [stats, setStats] = useState({ items: 0, outfits: 0 })
  const [loading, setLoading] = useState(true)
  const [recentItems, setRecentItems] = useState<any[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const [itemsRes, outfitsRes] = await Promise.all([
        wardrobeApi.getItems({ limit: 6 }),
        outfitApi.getOutfits({ limit: 6 })
      ])
      setRecentItems(itemsRes.data.items || [])
      setStats({ items: itemsRes.data.pagination?.total || 0, outfits: outfitsRes.data.pagination?.total || 0 })
    } catch (e) { addToast('Failed to load', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your StyleAI</h1>
          <p className="text-text-secondary">{stats.items} items in wardrobe</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Wardrobe Items', value: stats.items, icon: Shirt, color: 'bg-accent' },
          { label: 'Saved Outfits', value: stats.outfits, icon: Sparkles, color: 'bg-success' }
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {recentItems.length > 0 ? (
        <div className="card">
          <h2 className="font-semibold mb-4">Recent Items</h2>
          <div className="flex gap-2 overflow-x-auto">
            {recentItems.map((item) => (
              <Link key={item.id} to={`/wardrobe/edit/${item.id}`} className="flex-shrink-0">
                <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
              </Link>
            ))}
          </div>
          <Link to="/wardrobe" className="text-sm text-accent mt-2 block">View all items</Link>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-8">
          <Shirt size={40} className="mx-auto mb-3 text-text-secondary" />
          <h3 className="font-semibold mb-2">Start Building Your Wardrobe</h3>
          <p className="text-sm text-text-secondary mb-4">Add items or just generate outfits to see suggestions</p>
          <Link to="/wardrobe/add" className="btn btn-primary mr-2">
            <Plus size={18} className="inline mr-1" /> Add Item
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link to="/recommendations" className="card hover:border-accent flex items-center gap-3">
          <Sparkles size={24} className="text-accent" />
          <div>
            <p className="font-medium">Get Outfits</p>
            <p className="text-xs text-text-secondary">AI suggestions</p>
          </div>
        </Link>
        <Link to="/wardrobe" className="card hover:border-accent flex items-center gap-3">
          <Plus size={24} className="text-accent" />
          <div>
            <p className="font-medium">Add Items</p>
            <p className="text-xs text-text-secondary">Build wardrobe</p>
          </div>
        </Link>
      </div>
    </div>
  )
}