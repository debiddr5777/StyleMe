import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Loader, Heart, Trash2, Edit } from 'lucide-react'
import { wardrobeApi } from '../utils/api'
import { useWardrobeStore, useUIStore } from '../store'

const categories = [
  { value: '', label: 'All' },
  { value: 'shirts', label: 'Shirts' },
  { value: 'pants', label: 'Pants' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'outerwear', label: 'Outerwear' }
]

const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'All Season']

export default function Wardrobe() {
  const { items, setItems, selectedCategory, setSelectedCategory, filters, setFilters, removeItem } = useWardrobeStore()
  const addToast = useUIStore((state) => state.addToast)
  
  const [page] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [selectedCategory, filters, page])

  const loadItems = async () => {
    setLoading(true)
    try {
      const { data } = await wardrobeApi.getItems({
        category: selectedCategory || undefined,
        season: filters.season || undefined,
        style: filters.style || undefined,
        favorite: filters.favorite || undefined,
        page,
        limit: 20
      })
      setItems(data.items || [])
    } catch (error: any) {
      addToast('Failed to load items', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await wardrobeApi.deleteItem(id)
      removeItem(id)
      addToast('Item deleted', 'success')
      loadItems()
    } catch (error: any) {
      addToast('Failed to delete item', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const toggleFavorite = async (id: string) => {
    try {
      const { data } = await wardrobeApi.toggleFavorite(id)
      useWardrobeStore.getState().updateItem(id, { isFavorite: data.isFavorite })
    } catch (error: any) {
      console.error('Failed to toggle favorite')
    }
  }

  const filteredItems = search 
    ? items.filter(i => 
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.brand?.toLowerCase().includes(search.toLowerCase()) ||
        i.category?.toLowerCase().includes(search.toLowerCase())
      )
    : items

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Wardrobe</h1>
          <p className="text-text-secondary">{items.length} items</p>
        </div>
        <Link to="/wardrobe/add" className="btn btn-primary">
          <Plus size={18} className="inline mr-2" />
          Add Item
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="input pl-12"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
        >
          Filters
          {Object.values(filters).some(v => v) && (
            <span className="ml-2 w-2 h-2 rounded-full bg-white inline-block" />
          )}
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filters</h3>
            <button
              onClick={() => setFilters({ season: null, style: null, favorite: false })}
              className="text-sm text-accent hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Season</label>
              <div className="flex flex-wrap gap-2">
                {seasons.map(season => (
                  <button
                    key={season}
                    onClick={() => setFilters({ season: filters.season === season ? null : season })}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      filters.season === season
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
              <label className="block text-sm font-medium mb-2">Show</label>
              <button
                onClick={() => setFilters({ favorite: !filters.favorite })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  filters.favorite
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border'
                }`}
              >
                <Heart size={16} fill={filters.favorite ? 'currentColor' : 'none'} />
                Favorites only
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === cat.value
                ? 'bg-accent text-white'
                : 'bg-surface border border-border hover:border-accent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={32} className="animate-spin text-accent" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group relative card card-hover p-0 overflow-hidden"
            >
              <Link to={`/wardrobe/edit/${item.id}`} className="block aspect-square">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className="p-2 rounded-lg bg-surface/80 hover:bg-surface"
                >
                  <Heart
                    size={16}
                    fill={item.isFavorite ? 'currentColor' : 'none'}
                    className={item.isFavorite ? 'text-accent' : ''}
                  />
                </button>
                <Link
                  to={`/wardrobe/edit/${item.id}`}
                  className="p-2 rounded-lg bg-surface/80 hover:bg-surface"
                >
                  <Edit size={16} />
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-2 rounded-lg bg-surface/80 hover:bg-surface text-accent"
                >
                  {deleting === item.id ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="font-medium text-sm truncate">{item.name || item.category}</p>
                <p className="text-xs text-text-secondary truncate">{item.brand || 'No brand'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Plus size={48} className="mx-auto mb-4 text-text-secondary" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-text-secondary mb-4">
            {search ? 'Try a different search term' : 'Add your first wardrobe item'}
          </p>
          <Link to="/wardrobe/add" className="btn btn-primary">
            <Plus size={18} className="inline mr-2" />
            Add Item
          </Link>
        </div>
      )}
    </div>
  )
}