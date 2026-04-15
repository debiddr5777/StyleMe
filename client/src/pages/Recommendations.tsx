import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Loader, Save, ShoppingBag } from 'lucide-react'
import { recommendationApi, outfitApi, wardrobeApi } from '../utils/api'
import { useUIStore, useWardrobeStore } from '../store'

const occasions = ['Work', 'Party', 'Date', 'Casual', 'Formal']

export default function Recommendations() {
  const addToast = useUIStore((state) => state.addToast)
  const { items, setItems } = useWardrobeStore()
  const [generating, setGenerating] = useState(false)
  const [outfits, setOutfits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [occasion, setOccasion] = useState('')
  
  useEffect(() => {
    loadUserItems()
  }, [])

  const loadUserItems = async () => {
    setLoading(true)
    try {
      const { data } = await wardrobeApi.getItems({ limit: 20 })
      setItems(data.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const generateOutfits = async () => {
    setGenerating(true)
    try {
      const { data } = await recommendationApi.generate({ occasion })
      setOutfits(data.outfits || [])
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Failed', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const saveOutfit = async (outfit: any) => {
    try {
      const items = outfit.items.map((i: any) => ({ id: i.id, category: i.category }))
      await outfitApi.saveOutfit({ items, occasion })
      addToast('Outfit saved!', 'success')
    } catch (error: any) {
      addToast('Failed to save', 'error')
    }
  }

  const userItemCount = items.filter((i: any) => i.isUserItem !== false).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Outfit Suggestions</h1>
        <p className="text-text-secondary">
          {userItemCount} items from your wardrobe + AI suggestions
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size={32} className="animate-spin text-accent" />
        </div>
      ) : (
        <>
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4">
              <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="input flex-1">
                <option value="">Any occasion</option>
                {occasions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <button onClick={generateOutfits} disabled={generating} className="btn btn-primary">
                {generating ? <Loader size={18} className="inline mr-2 animate-spin" /> : <Sparkles size={18} className="inline mr-2" />}
                Generate Outfits
              </button>
            </div>
          </div>

          {outfits.length > 0 ? (
            <div className="space-y-6">
              {outfits.map((outfit, idx) => (
                <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">Outfit {idx + 1}</span>
                      <span className="badge badge-accent">{Math.round(outfit.score * 100)}% match</span>
                    </div>
                    <button onClick={() => saveOutfit(outfit)} className="btn btn-secondary text-sm">
                      <Save size={16} className="inline mr-1" /> Save
                    </button>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {outfit.items?.map((item: any, i: number) => (
                      <div key={i} className="flex-shrink-0 w-28">
                        <div className="aspect-square rounded-lg overflow-hidden bg-background mb-2">
                          <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs truncate capitalize">{item.category}</p>
                        {item.isUserItem !== false && (
                          <span className="text-xs text-accent block">Your item</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-text-secondary mt-2">
                    Uses {outfit.items?.filter((i: any) => i.isUserItem !== false).length} of your items
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <Sparkles size={40} className="mx-auto mb-3 text-text-secondary" />
              <p className="mb-4">Click "Generate Outfits" to get suggestions</p>
              <button onClick={generateOutfits} className="btn btn-primary">
                <Sparkles size={18} className="inline mr-2" /> Generate Now
              </button>
            </div>
          )}

          {items.length > 0 && (
            <div className="card">
              <h3 className="font-medium mb-3">Your Wardrobe ({items.length} items)</h3>
              <div className="flex gap-2 overflow-x-auto">
                {items.slice(0, 8).map((item: any) => (
                  <img key={item.id} src={item.imageUrl} alt={item.category} className="w-16 h-16 rounded-lg object-cover" />
                ))}
              </div>
              <Link to="/wardrobe" className="text-sm text-accent mt-2 block">View all</Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}