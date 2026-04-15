import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Check, Sparkles, Loader, SkipForward } from 'lucide-react'
import { userApi } from '../utils/api'
import { useAuthStore, useUIStore } from '../store'

const styles = ['Casual', 'Formal', 'Sporty', 'Streetwear']

export default function Onboarding() {
  const navigate = useNavigate()
  const { updateUser } = useAuthStore()
  const addToast = useUIStore((state) => state.addToast)
  
  const [step, setStep] = useState(1)
  const [styles2, setStyles2] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleStyle = (style: string) => {
    setStyles2(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style])
  }

  const handleComplete = async (skip = false) => {
    setLoading(true)
    try {
      if (!skip) {
        await userApi.updatePreferences({ stylePreferences: styles2, colorPreferences: [] })
        updateUser({ stylePreferences: styles2 })
      }
      navigate('/dashboard')
    } catch (e: any) {
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Personalize Your Style</h1>
          <p className="text-text-secondary text-sm">Optional - just helps us give better suggestions</p>
        </div>

        <div className="card">
          {step === 1 && (
            <>
              <p className="text-text-secondary mb-4">Select styles you like (or skip):</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {styles.map(style => (
                  <button
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      styles2.includes(style)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-accent'
                    }`}
                  >
                    {styles2.includes(style) && <Check size={14} className="inline mr-1" />}
                    {style}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button onClick={() => handleComplete(true)} disabled={loading} className="btn btn-secondary flex-1">
              Skip this
            </button>
            <button onClick={() => handleComplete(false)} disabled={loading} className="btn btn-primary flex-1">
              {loading ? <Loader size={18} className="inline mr-2 animate-spin" /> : null}
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}