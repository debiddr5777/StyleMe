import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Heart, ShoppingBag, ExternalLink, Loader, Trash2 } from 'lucide-react'
import { shoppingApi } from '../utils/api'
import { useUIStore } from '../store'

export default function Shopping() {
  const addToast = useUIStore((state) => state.addToast)
  const [products, setProducts] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searched, setSearched] = useState(false)

  const searchProducts = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const { data } = await shoppingApi.search({ query: searchQuery })
      setProducts(data.products || [])
    } catch (error) {
      console.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const loadWishlist = async () => {
    try {
      const { data } = await shoppingApi.getWishlist()
      setWishlist(data || [])
    } catch (error) {
      console.error('Failed to load wishlist')
    }
  }

  const addToWishlist = async (product: any) => {
    try {
      await shoppingApi.addToWishlist({
        productUrl: product.url,
        productData: product
      })
      addToast('Added to wishlist', 'success')
      loadWishlist()
    } catch (error) {
      addToast('Already in wishlist', 'info')
    }
  }

  const removeFromWishlist = async (id: string) => {
    try {
      await shoppingApi.removeFromWishlist(id)
      setWishlist(wishlist.filter(w => w.id !== id))
      addToast('Removed from wishlist', 'success')
    } catch (error) {
      addToast('Failed to remove', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shop</h1>
        <p className="text-text-secondary">Find complementary items</p>
      </div>

      <div className="card">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for items..."
            className="input flex-1"
            onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
          />
          <button
            onClick={searchProducts}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
          </button>
        </div>
      </div>

      {products.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card"
            >
              <div className="aspect-square rounded-xl overflow-hidden bg-background mb-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold mb-1">{product.name}</h3>
              <p className="text-sm text-text-secondary mb-2">{product.brand}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">${product.price}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => addToWishlist(product)}
                    className="btn btn-secondary py-2"
                  >
                    <Heart size={18} />
                  </button>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary py-2"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {products.length === 0 && searched && !loading && (
        <div className="card text-center py-12">
          <ShoppingBag size={48} className="mx-auto mb-4 text-text-secondary" />
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p className="text-text-secondary">Try a different search term</p>
        </div>
      )}

      {products.length === 0 && !searched && (
        <div className="card text-center py-12">
          <ShoppingBag size={48} className="mx-auto mb-4 text-text-secondary" />
          <h3 className="text-xl font-semibold mb-2">Start Shopping</h3>
          <p className="text-text-secondary mb-4">
            Search for items to complement your wardrobe
          </p>
          <button onClick={searchProducts} className="btn btn-primary">
            Browse Recommendations
          </button>
        </div>
      )}

      {wishlist.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">My Wishlist</h2>
          <div className="space-y-4">
            {wishlist.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-background rounded-xl">
                <img
                  src={item.productData?.image}
                  alt=""
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.productData?.name}</h4>
                  <p className="text-sm text-text-secondary">{item.productData?.brand}</p>
                  <p className="font-bold">${item.productData?.price}</p>
                </div>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="btn btn-secondary py-2 self-start text-accent"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}