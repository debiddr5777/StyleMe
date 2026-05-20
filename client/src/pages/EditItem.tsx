import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Loader, Heart, Trash2, ArrowLeft } from 'lucide-react'
import { wardrobeApi } from '../utils/api'
import { useWardrobeStore, useUIStore } from '../store'

const categories = ['shirts', 'pants', 'dresses', 'shoes', 'accessories', 'outerwear', 'tops', 'bottoms']
const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'All Season']
const styles = ['Casual', 'Formal', 'Business Casual', 'Sporty', 'Streetwear', 'Elegant', 'Boho', 'Minimalist']

export default function EditItem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateItem, removeItem } = useWardrobeStore()
  const addToast = useUIStore((state) => state.addToast)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [item, setItem] = useState<any>(null)

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    brand: '',
    name: '',
    productUrl: '',
    season: [] as string[],
    tags: [] as string[],
    styleTags: [] as string[]
  })

  useEffect(() => {
    if (id) loadItem()
  }, [id])

  const loadItem = async () => {
    try {
      const { data } = await wardrobeApi.getItem(id!)
      setItem(data)
      setFormData({
        category: data.category || '',
        subcategory: data.subcategory || '',
        brand: data.brand || '',
        name: data.name || '',
        productUrl: data.productUrl || '',
        season: data.season || [],
        tags: data.tags || [],
        styleTags: data.styleTags || []
      })
    } catch (error: any) {
      addToast('Item not found', 'error')
      navigate('/wardrobe')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await wardrobeApi.updateItem(id!, formData)
      updateItem(id!, data)
      addToast('Item updated', 'success')
      navigate('/wardrobe')
    } catch (error: any) {
      addToast('Failed to update item', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this item?')) return
    try {
      await wardrobeApi.deleteItem(id!)
      removeItem(id!)
      addToast('Item deleted', 'success')
      navigate('/wardrobe')
    } catch (error: any) {
      addToast('Failed to delete item', 'error')
    }
  }

  const toggleFavorite = async () => {
    try {
      const { data } = await wardrobeApi.toggleFavorite(id!)
      setItem((prev: any) => ({ ...prev, isFavorite: data.isFavorite }))
      updateItem(id!, { isFavorite: data.isFavorite })
    } catch (error: any) {
      console.error('Failed to toggle favorite')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={32} className="animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/wardrobe" className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-2">
            <ArrowLeft size={18} />
            Back to Wardrobe
          </Link>
          <h1 className="text-3xl font-bold">Edit Item</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleFavorite} className="btn btn-secondary">
            <Heart size={18} fill={item?.isFavorite ? 'currentColor' : 'none'} className={item?.isFavorite ? 'text-accent' : ''} />
          </button>
          <button onClick={handleDelete} className="btn btn-secondary text-accent">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {item && (
        <div className="card">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full max-h-96 object-contain rounded-xl bg-background mb-6"
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Item Details</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="input"
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Item name"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Brand name"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Product URL</label>
              <input
                type="url"
                value={formData.productUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, productUrl: e.target.value }))}
                placeholder="https://..."
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Season</label>
              <div className="flex flex-wrap gap-2">
                {seasons.map(season => (
                  <button
                    key={season}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      season: prev.season.includes(season)
                        ? prev.season.filter(s => s !== season)
                        : [...prev.season, season]
                    }))}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      formData.season.includes(season)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border'
                    }`}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Style Tags</label>
              <div className="flex flex-wrap gap-2">
                {styles.map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      styleTags: prev.styleTags.includes(style)
                        ? prev.styleTags.filter(s => s !== style)
                        : [...prev.styleTags, style]
                    }))}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      formData.styleTags.includes(style)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link to="/wardrobe" className="btn btn-secondary flex-1">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary flex-1"
          >
            {saving ? <Loader size={18} className="inline mr-2 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}