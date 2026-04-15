import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader, Sparkles, ExternalLink } from 'lucide-react'
import { wardrobeApi } from '../utils/api'
import { useWardrobeStore, useUIStore } from '../store'

export default function AddItem() {
  const navigate = useNavigate()
  const addItem = useWardrobeStore((state) => state.addItem)
  const addToast = useUIStore((state) => state.addToast)
  
  const [productUrl, setProductUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{image?: string; name?: string} | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setPreview({ image: URL.createObjectURL(file), name: file.name })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data: item } = await wardrobeApi.addItem({
        productUrl: productUrl || '',
        imageUrl: preview?.image || '',
        category: 'shirts',
        name: preview?.name || ''
      })
      
      addItem(item)
      addToast('Item added!', 'success')
      navigate('/wardrobe')
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Failed to add item', 'error')
    } finally {
      setLoading(false)
    }
  }

  const quickAdd = async (url: string) => {
    setLoading(true)
    setProductUrl(url)
    try {
      const { data: item } = await wardrobeApi.addItem({ productUrl: url, category: 'shirts' })
      addItem(item)
      addToast('Item added!', 'success')
      navigate('/wardrobe')
    } catch (error: any) {
      addToast('Failed to add item', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add to Wardrobe</h1>
        <p className="text-text-secondary">Paste a product link - we'll extract the image</p>
      </div>

      <div className="card">
        <label className="block text-sm font-medium mb-2">Product Link</label>
        <input
          type="url"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          placeholder="https://zara.com/... or any clothing store"
          className="input"
        />
        <p className="text-xs text-text-secondary mt-2">
          We'll auto-extract the image and details
        </p>
      </div>

      <div className="card">
        <label className="block text-sm font-medium mb-2">Or upload an image</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${isDragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-accent'}`}
        >
          <input {...getInputProps()} />
          {preview?.image ? (
            <img src={preview.image} alt="Preview" className="w-full max-h-32 object-contain" />
          ) : (
            <>
              <Upload size={24} className="mx-auto mb-2 text-text-secondary" />
              <p className="text-sm">Drop image or click</p>
            </>
          )}
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading} className="btn btn-primary w-full">
        {loading ? <Loader size={18} className="inline mr-2 animate-spin" /> : <Sparkles size={18} className="inline mr-2" />}
        {loading ? 'Adding...' : 'Add Item'}
      </button>

      <Link to="/wardrobe" className="block text-center text-text-secondary">
        Skip - Go to Wardrobe
      </Link>
    </div>
  )
}