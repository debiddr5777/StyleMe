import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Link2, Sparkles, ExternalLink, Heart, Loader2,
  TrendingUp, ShoppingBag, Tag, Star, ChevronRight,
  AlertCircle, X, History, Check
} from 'lucide-react'
import { styleMatchApi, shoppingApi } from '../utils/api'
import { useUIStore } from '../store'

interface SourceProduct {
  title: string
  image: string
  price: string | null
  brand: string
  url: string
  category: string
  dominantColor: string
  colors: Array<{ hex: string; name: string; percentage: number }>
}

interface Recommendation {
  id: string
  title: string
  brand: string
  price: string
  image: string
  url: string
  retailer: string
  pairingCategory: string
  reason: string
  trendSource: string
  compatibilityScore: number
}

type LoadingPhase = 'idle' | 'scraping' | 'analyzing' | 'trending' | 'searching' | 'done' | 'error'

const LOADING_PHASES: Record<Exclude<LoadingPhase, 'idle' | 'done' | 'error'>, string> = {
  scraping: 'Fetching product details...',
  analyzing: 'Analyzing style & colors...',
  trending: 'Checking real-time trend data...',
  searching: 'Finding complementary products...',
}

export default function StyleMatch() {
  const addToast = useUIStore((state) => state.addToast)
  const [productUrl, setProductUrl] = useState('')
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle')
  const [sourceProduct, setSourceProduct] = useState<SourceProduct | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [trendContext, setTrendContext] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  const isLoading = loadingPhase !== 'idle' && loadingPhase !== 'done' && loadingPhase !== 'error'

  const handleAnalyze = async () => {
    const url = productUrl.trim()
    if (!url) {
      inputRef.current?.focus()
      return
    }
    if (!url.startsWith('http')) {
      setErrorMsg('Please enter a valid URL starting with http:// or https://')
      return
    }

    setErrorMsg('')
    setSourceProduct(null)
    setRecommendations([])
    setTrendContext('')
    setLoadingPhase('scraping')

    // Simulate phase progression for UX
    const phaseTimer1 = setTimeout(() => setLoadingPhase('analyzing'), 1500)
    const phaseTimer2 = setTimeout(() => setLoadingPhase('trending'), 3500)
    const phaseTimer3 = setTimeout(() => setLoadingPhase('searching'), 6000)

    try {
      const { data } = await styleMatchApi.analyze(url)
      clearTimeout(phaseTimer1)
      clearTimeout(phaseTimer2)
      clearTimeout(phaseTimer3)

      setSourceProduct(data.sourceProduct)
      setRecommendations(data.recommendations || [])
      setTrendContext(data.trendContext || '')
      setLoadingPhase('done')
    } catch (err: any) {
      clearTimeout(phaseTimer1)
      clearTimeout(phaseTimer2)
      clearTimeout(phaseTimer3)
      const msg = err?.response?.data?.error || 'Failed to analyze product. Please try another URL.'
      setErrorMsg(msg)
      setLoadingPhase('error')
    }
  }

  const handleWishlist = async (rec: Recommendation) => {
    try {
      await shoppingApi.addToWishlist({ productUrl: rec.url, productData: rec })
      setSavedIds(prev => new Set([...prev, rec.id]))
      addToast('Saved to wishlist!', 'success')
    } catch {
      addToast('Already in wishlist', 'info')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  const scoreColor = (score: number) => {
    if (score >= 90) return '#4ADE80'
    if (score >= 75) return '#FBBF24'
    return '#E94560'
  }

  const scoreLabel = (score: number) => {
    if (score >= 90) return 'Perfect Match'
    if (score >= 75) return 'Great Pair'
    return 'Good Pair'
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F0F1A] border border-border p-8">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #E94560 0%, transparent 60%), radial-gradient(circle at 80% 20%, #7C3AED 0%, transparent 60%)`,
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
              <Sparkles size={20} className="text-accent" />
            </div>
            <span className="text-sm font-medium text-accent uppercase tracking-widest">Style Match</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            What goes with <span className="text-accent">this?</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl">
            Paste any product link — we'll analyze it and find what actually goes with it,
            based on <span className="text-white font-medium">real 2025 trend data</span> from Pinterest, Google Shopping, and fashion editorials.
          </p>
        </div>
      </div>

      {/* URL Input */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              ref={inputRef}
              type="url"
              value={productUrl}
              onChange={(e) => { setProductUrl(e.target.value); setErrorMsg('') }}
              onKeyDown={handleKeyDown}
              placeholder="https://www.zara.com/... or any product page URL"
              className="input pl-11 w-full"
              disabled={isLoading}
            />
          </div>
          <motion.button
            onClick={handleAnalyze}
            disabled={isLoading || !productUrl.trim()}
            className="btn btn-primary gap-2 min-w-[160px] justify-center"
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Match Style
              </>
            )}
          </motion.button>
        </div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm"
          >
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-300 font-medium">{errorMsg}</p>
              <p className="text-text-secondary mt-1">Try a link from Zara, H&M, Uniqlo, Nike, ASOS, Myntra, etc.</p>
            </div>
          </motion.div>
        )}

        {/* Example links */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-text-secondary">Try:</span>
          {[
            { label: 'Zara shirt', url: 'https://www.zara.com/in/en/slim-fit-oxford-shirt-p06789341.html' },
            { label: 'H&M jeans', url: 'https://www2.hm.com/en_in/productpage.1080893002.html' },
            { label: 'Uniqlo tee', url: 'https://www.uniqlo.com/in/en/products/E460753-000/00' },
          ].map(({ label, url }) => (
            <button
              key={label}
              onClick={() => { setProductUrl(url); setErrorMsg('') }}
              className="text-xs px-3 py-1 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors"
            >
              {label} ↗
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                <div className="absolute inset-0 rounded-full border-2 border-t-accent animate-spin" />
                <Sparkles size={16} className="absolute inset-0 m-auto text-accent" />
              </div>
              <div>
                <p className="font-semibold text-white">
                  {LOADING_PHASES[loadingPhase as keyof typeof LOADING_PHASES]}
                </p>
                <p className="text-sm text-text-secondary">This takes 5–15 seconds</p>
              </div>
            </div>

            {/* Phase steps */}
            <div className="space-y-3">
              {(Object.entries(LOADING_PHASES) as [string, string][]).map(([phase, label], i) => {
                const phases = Object.keys(LOADING_PHASES)
                const currentIndex = phases.indexOf(loadingPhase as string)
                const phaseIndex = i
                const status = phaseIndex < currentIndex ? 'done' : phaseIndex === currentIndex ? 'active' : 'pending'

                return (
                  <div key={phase} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 transition-all duration-500 ${
                      status === 'done' ? 'bg-green-500/20 border border-green-500/40' :
                      status === 'active' ? 'bg-accent/20 border border-accent/40' :
                      'bg-surface border border-border'
                    }`}>
                      {status === 'done' ? (
                        <Check size={12} className="text-green-400" />
                      ) : status === 'active' ? (
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-text-secondary/30" />
                      )}
                    </div>
                    <span className={`text-sm transition-colors duration-500 ${
                      status === 'done' ? 'text-green-400' :
                      status === 'active' ? 'text-white font-medium' :
                      'text-text-secondary'
                    }`}>{label}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {loadingPhase === 'done' && sourceProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Source Product Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-text-secondary uppercase tracking-wider">
                <Tag size={14} />
                You're styling
              </div>
              <div className="flex gap-6 flex-col sm:flex-row">
                {sourceProduct.image && (
                  <div className="w-full sm:w-48 h-64 sm:h-48 rounded-2xl overflow-hidden bg-surface shrink-0">
                    <img
                      src={sourceProduct.image}
                      alt={sourceProduct.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  {sourceProduct.brand && (
                    <span className="text-xs font-medium uppercase tracking-widest text-accent">
                      {sourceProduct.brand}
                    </span>
                  )}
                  <h2 className="text-xl font-bold mt-1 mb-2">{sourceProduct.title || 'Product'}</h2>

                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {sourceProduct.price && (
                      <span className="text-2xl font-bold text-white">{sourceProduct.price}</span>
                    )}
                    {sourceProduct.category && (
                      <span className="px-3 py-1 rounded-full bg-surface border border-border text-sm text-text-secondary capitalize">
                        {sourceProduct.category.replace(/[|_]/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* Color palette */}
                  {sourceProduct.colors && sourceProduct.colors.length > 0 && (
                    <div>
                      <p className="text-xs text-text-secondary mb-2">Detected colors</p>
                      <div className="flex gap-2 flex-wrap">
                        {sourceProduct.colors.slice(0, 5).map((color, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-full border border-white/10"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                            <span className="text-xs text-text-secondary">{color.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <a
                    href={sourceProduct.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-sm text-accent hover:underline"
                  >
                    View original product <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Trend Context Banner */}
            {trendContext && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-4 p-5 rounded-2xl bg-accent/10 border border-accent/20"
              >
                <TrendingUp size={20} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white mb-1">Trend Insight</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{trendContext}</p>
                </div>
              </motion.div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    Pairs perfectly with these
                    <span className="ml-2 text-sm font-normal text-text-secondary">
                      ({recommendations.length} picks)
                    </span>
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recommendations.map((rec, i) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="card group hover:border-accent/30 transition-all duration-300 flex flex-col"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface mb-4">
                        <img
                          src={rec.image}
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80'
                          }}
                        />

                        {/* Compatibility score badge */}
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-md border"
                          style={{
                            backgroundColor: `${scoreColor(rec.compatibilityScore)}20`,
                            borderColor: `${scoreColor(rec.compatibilityScore)}40`,
                            color: scoreColor(rec.compatibilityScore),
                          }}
                        >
                          <Star size={10} fill="currentColor" />
                          {rec.compatibilityScore}%
                        </div>

                        {/* Save button */}
                        <button
                          onClick={() => handleWishlist(rec)}
                          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent/80"
                        >
                          {savedIds.has(rec.id) ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Heart size={14} className="text-white" />
                          )}
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col">
                        <div className="mb-1">
                          <span className="text-xs font-medium text-accent uppercase tracking-wider">
                            {rec.brand}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2 leading-snug">
                          {rec.title}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-white">{rec.price}</span>
                          <span className="text-xs text-text-secondary">{rec.retailer}</span>
                        </div>

                        {/* Match label */}
                        <div
                          className="text-xs font-semibold px-2 py-0.5 rounded-md w-fit mb-3"
                          style={{
                            backgroundColor: `${scoreColor(rec.compatibilityScore)}15`,
                            color: scoreColor(rec.compatibilityScore),
                          }}
                        >
                          {scoreLabel(rec.compatibilityScore)}
                        </div>

                        {/* Trend Reason */}
                        <div className="flex gap-2 p-3 rounded-xl bg-surface/50 border border-border/50 mb-4 flex-1">
                          <TrendingUp size={13} className="text-accent shrink-0 mt-0.5" />
                          <p className="text-xs text-text-secondary leading-relaxed">{rec.reason}</p>
                        </div>

                        {/* Trend source tag */}
                        <div className="text-xs text-text-secondary/60 mb-3 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          {rec.trendSource}
                        </div>

                        {/* Shop Now */}
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary py-2.5 text-sm justify-center gap-2 w-full mt-auto"
                        >
                          <ShoppingBag size={15} />
                          Shop Now
                          <ChevronRight size={14} />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.length === 0 && (
              <div className="card text-center py-12">
                <ShoppingBag size={48} className="mx-auto mb-4 text-text-secondary" />
                <h3 className="text-xl font-semibold mb-2">No recommendations found</h3>
                <p className="text-text-secondary">Try a different product URL</p>
              </div>
            )}

            {/* Try another */}
            <div className="text-center">
              <button
                onClick={() => {
                  setProductUrl('')
                  setSourceProduct(null)
                  setRecommendations([])
                  setLoadingPhase('idle')
                  setTimeout(() => inputRef.current?.focus(), 100)
                }}
                className="btn btn-secondary gap-2"
              >
                <X size={16} />
                Try a different product
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {loadingPhase === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            {
              icon: Link2,
              title: 'Paste any product link',
              desc: 'From Zara, H&M, Uniqlo, Nike, ASOS, Myntra, Ajio, and hundreds more stores worldwide',
            },
            {
              icon: TrendingUp,
              title: 'We check real trends',
              desc: 'We scan Pinterest boards, Google Shopping, and fashion editorials for what\'s actually trending in 2025',
            },
            {
              icon: ShoppingBag,
              title: 'Get shoppable picks',
              desc: 'Every recommendation links to a real product page with the current price',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card text-center">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                <Icon size={22} className="text-accent" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
