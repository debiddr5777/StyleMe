import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Loader, Save, ShoppingBag, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { recommendationApi, outfitApi, wardrobeApi } from '../utils/api'
import { useUIStore, useWardrobeStore, useAuthStore } from '../store'

const occasions = [
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'casual', label: 'Casual', icon: '☕' },
  { value: 'party', label: 'Party', icon: '🎉' },
  { value: 'date', label: 'Date', icon: '🌙' },
  { value: 'formal', label: 'Formal', icon: '✨' },
  { value: 'workout', label: 'Gym', icon: '💪' },
]

const genderOptions = [
  { value: 'male', label: 'Men', icon: '👔' },
  { value: 'female', label: 'Women', icon: '👗' },
]

export default function Recommendations() {
  const addToast = useUIStore((state) => state.addToast)
  const { items, setItems } = useWardrobeStore()
  const { user } = useAuthStore()
  const [generating, setGenerating] = useState(false)
  const [outfits, setOutfits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [occasion, setOccasion] = useState('casual')
  const [gender, setGender] = useState(user?.gender || 'male')
  
  useEffect(() => {
    loadUserItems()
  }, [])

  useEffect(() => {
    if (user?.gender) setGender(user.gender)
  }, [user])

  const loadUserItems = async () => {
    setLoading(true)
    try {
      const { data } = await wardrobeApi.getItems({ limit: 50 })
      setItems(data.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const generateOutfits = async () => {
    setGenerating(true)
    try {
      const { data } = await recommendationApi.generate({ occasion, gender })
      setOutfits(data.outfits || [])
      if (!data.outfits?.length) {
        addToast('Add items to your wardrobe to get personalized suggestions', 'info')
      }
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Failed to generate', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const saveOutfit = async (outfit: any) => {
    try {
      const itemIds = outfit.items
        .filter((i: any) => i.isUserItem && !i.id.startsWith('fallback-'))
        .map((i: any) => i.id)
      await outfitApi.saveOutfit({ items: itemIds, occasion })
      addToast('Outfit saved!', 'success')
    } catch (error: any) {
      addToast('Failed to save', 'error')
    }
  }

  const userItems = items.filter((i: any) => i.isUserItem !== false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Outfit Suggestions</h1>
        <p className="text-text-secondary">
          {userItems.length > 0 
            ? `${userItems.length} items in your wardrobe - we'll suggest pieces that match the occasion`
            : 'Add items to get personalized outfit suggestions'}
        </p>
      </div>

      <div className="card">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <label className="text-sm text-text-secondary mb-2 block">For</label>
            <div className="flex gap-2">
              {genderOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setGender(opt.value)}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                    gender === opt.value 
                      ? 'border-accent bg-accent/10 text-accent' 
                      : 'border-border hover:border-accent'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="text-sm text-text-secondary mb-2 block">Occasion</label>
            <div className="flex flex-wrap gap-2">
              {occasions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setOccasion(opt.value)}
                  className={`px-4 py-2 rounded-xl border transition-all ${
                    occasion === opt.value 
                      ? 'border-accent bg-accent/10 text-accent' 
                      : 'border-border hover:border-accent'
                  }`}
                >
                  <span className="mr-1">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={generateOutfits} 
          disabled={generating}
          className="btn btn-primary w-full mt-6"
        >
          {generating ? (
            <><Loader size={18} className="inline mr-2 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles size={18} className="inline mr-2" /> Generate Outfits</>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader size={32} className="animate-spin text-accent" />
        </div>
      ) : (
        <>
          {outfits.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-text-secondary text-sm">
                {outfits[0]?.composition || 'Generated outfits'}
              </p>
              <button onClick={generateOutfits} className="btn btn-ghost text-sm">
                <RefreshCw size={14} className="inline mr-1" /> More
              </button>
            </div>
          )}

          {outfits.length > 0 ? (
            <div className="grid gap-6">
              {outfits.map((outfit, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold">Look {idx + 1}</span>
                      <span className={`badge ${outfit.score >= 0.7 ? 'badge-success' : 'badge-accent'}`}>
                        {Math.round(outfit.score * 100)}% match
                      </span>
                      {outfit.userItemCount > 0 && (
                        <span className="text-sm text-accent">
                          {outfit.userItemCount} from your wardrobe
                        </span>
                      )}
                    </div>
                    <button onClick={() => saveOutfit(outfit)} className="btn btn-secondary text-sm">
                      <Save size={14} className="inline mr-1" /> Save
                    </button>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {outfit.items?.map((item: any, i: number) => (
                      <div key={i} className="flex-shrink-0 w-32">
                        <div className="aspect-square rounded-xl overflow-hidden bg-surface border border-border relative">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name || item.category}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&q=80`;
                            }}
                          />
                          {item.isUserItem && (
                            <span className="absolute top-1 right-1 bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full">
                              Yours
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-center mt-1 truncate capitalize">
                          {item.name || item.category?.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>

                  {outfit.reason && (
                    <p className="text-sm text-text-secondary mt-3 italic">
                      {outfit.reason}
                    </p>
                  )}

                  {outfit.suggestions?.length > 0 && (
                    <div className="mt-3 p-3 bg-surface/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={14} className="text-accent mt-0.5" />
                        <p className="text-xs text-text-secondary">
                          {outfit.suggestions[0].why}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Sparkles size={48} className="mx-auto mb-4 text-text-secondary" />
              <h3 className="text-lg font-medium mb-2">Ready to discover outfits?</h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                Select your style and occasion above, then hit Generate to see curated outfit suggestions.
              </p>
              {userItems.length === 0 ? (
                <div className="mb-6 p-4 bg-surface/50 rounded-xl">
                  <p className="text-sm text-text-secondary mb-3">
                    Start by adding clothes to your wardrobe for personalized suggestions.
                  </p>
                  <Link to="/wardrobe/add" className="btn btn-primary inline-block">
                    Add First Item
                  </Link>
                </div>
              ) : (
                <button onClick={generateOutfits} disabled={generating} className="btn btn-primary">
                  <Sparkles size={18} className="inline mr-2" /> Generate Now
                </button>
              )}
            </div>
          )}
        </>
      )}

      {userItems.length > 0 && (
        <div className="card">
          <h3 className="font-medium mb-3">Your Wardrobe ({userItems.length} items)</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {userItems.slice(0, 10).map((item: any) => (
              <div key={item.id} className="flex-shrink-0 w-20">
                <div className="aspect-square rounded-lg overflow-hidden bg-surface border border-border">
                  <img 
                    src={item.imageUrl} 
                    alt={item.category}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&q=80`;
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link to="/wardrobe" className="text-sm text-accent mt-3 block">View all</Link>
        </div>
      )}
    </div>
  )
}
