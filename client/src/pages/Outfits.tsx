import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Loader, Heart, Trash2, Star, Filter } from 'lucide-react'
import { outfitApi } from '../utils/api'
import { useUIStore } from '../store'

const occasions = ['Work', 'Party', 'Date', 'Casual Outing', 'Formal Event', 'Sports']

export default function Outfits() {
  const addToast = useUIStore((state) => state.addToast)
  const [outfits, setOutfits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadOutfits()
  }, [filter])

  const loadOutfits = async () => {
    setLoading(true)
    try {
      const { data } = await outfitApi.getOutfits({ favorite: filter === 'favorites' })
      setOutfits(data.outfits)
    } catch (error) {
      console.error('Failed to load outfits')
    } finally {
      setLoading(false)
    }
  }

  const deleteOutfit = async (id: string) => {
    if (!confirm('Delete this outfit?')) return
    try {
      await outfitApi.deleteOutfit(id)
      setOutfits(outfits.filter(o => o.id !== id))
      addToast('Outfit deleted', 'success')
    } catch (error) {
      addToast('Failed to delete outfit', 'error')
    }
  }

  const rateOutfit = async (id: string, rating: number) => {
    try {
      await outfitApi.rateOutfit(id, rating)
      setOutfits(outfits.map(o => o.id === id ? { ...o, rating } : o))
    } catch (error) {
      console.error('Failed to rate outfit')
    }
  }

  const toggleFavorite = async (id: string) => {
    try {
      const { data } = await outfitApi.toggleFavorite(id)
      setOutfits(outfits.map(o => o.id === id ? { ...o, isFavorite: data.isFavorite } : o))
    } catch (error) {
      console.error('Failed to toggle favorite')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Outfits</h1>
          <p className="text-text-secondary">{outfits.length} saved outfits</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilter('')} className={`btn ${!filter ? 'btn-primary' : 'btn-secondary'}`}>
          All
        </button>
        <button onClick={() => setFilter('favorites')} className={`btn ${filter === 'favorites' ? 'btn-primary' : 'btn-secondary'}`}>
          <Heart size={18} />
          Favorites
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      ) : outfits.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outfits.map((outfit) => (
            <motion.div
              key={outfit.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => rateOutfit(outfit.id, star)}>
                      <Star
                        size={18}
                        fill={star <= (outfit.rating || 0) ? 'currentColor' : 'none'}
                        className={star <= (outfit.rating || 0) ? 'text-yellow-400' : 'text-text-secondary'}
                      />
                    </button>
                  ))}
                </div>
                <button onClick={() => toggleFavorite(outfit.id)}>
                  <Heart
                    size={18}
                    fill={outfit.isFavorite ? 'currentColor' : 'none'}
                    className={outfit.isFavorite ? 'text-accent' : ''}
                  />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {outfit.items?.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="aspect-square rounded-lg bg-background overflow-hidden">
                    <img src={item.imageUrl || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
                <span className="badge badge-accent">{outfit.occasion || 'Any'}</span>
                <span>{outfit.styleType || 'Any style'}</span>
              </div>

              <button
                onClick={() => deleteOutfit(outfit.id)}
                className="btn btn-secondary w-full text-accent"
              >
                <Trash2 size={18} className="inline mr-2" />
                Delete
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Sparkles size={48} className="mx-auto mb-4 text-text-secondary" />
          <h3 className="text-xl font-semibold mb-2">No saved outfits</h3>
          <p className="text-text-secondary mb-4">
            Generate and save outfit recommendations
          </p>
          <Link to="/recommendations" className="btn btn-primary">
            Get Recommendations
          </Link>
        </div>
      )}
    </div>
  )
}