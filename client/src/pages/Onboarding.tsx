import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Check, Sparkles, Loader, SkipForward, Shirt, Heart } from 'lucide-react'
import { userApi } from '../utils/api'
import { useAuthStore, useUIStore } from '../store'

const styles = ['Casual', 'Formal', 'Sporty', 'Streetwear', 'Minimalist', 'Bohemian', 'Classic', 'Trendy']
const genderOptions = [
  { value: 'male', label: 'Men', icon: '👔' },
  { value: 'female', label: 'Women', icon: '👗' },
  { value: 'neutral', label: 'Unisex', icon: '👕' }
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { updateUser } = useAuthStore()
  const addToast = useUIStore((state) => state.addToast)
  
  const [step, setStep] = useState(1)
  const [gender, setGender] = useState('')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style])
  }

  const handleComplete = async (skip = false) => {
    setLoading(true)
    try {
      if (!skip) {
        await userApi.updatePreferences({ 
          gender: gender || undefined,
          stylePreferences: selectedStyles, 
          colorPreferences: [] 
        })
        updateUser({ 
          gender: gender || undefined,
          stylePreferences: selectedStyles 
        })
      }
      navigate('/dashboard')
    } catch (e: any) {
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = step === 1 || (step === 2 && selectedStyles.length > 0)

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Personalize Your Style</h1>
          <p className="text-text-secondary text-sm">Help us suggest outfits that match you</p>
        </div>

        <div className="card">
          {step === 1 && (
            <>
              <p className="text-text-secondary mb-4 text-center">What's your style?</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {genderOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setGender(option.value)
                      setStep(2)
                    }}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      gender === option.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent'
                    }`}
                  >
                    <span className="text-3xl">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-text-secondary mb-4">Select your style preferences:</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {styles.map(style => (
                  <button
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      selectedStyles.includes(style)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-accent'
                    }`}
                  >
                    {selectedStyles.includes(style) && <Check size={14} className="inline mr-1" />}
                    {style}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary mb-4">Select all that apply</p>
            </>
          )}

          <div className="flex gap-3">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)} 
                className="btn btn-secondary flex-1"
              >
                Back
              </button>
            )}
            <button 
              onClick={() => handleComplete(false)} 
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? <Loader size={18} className="inline mr-2 animate-spin" /> : null}
              {loading ? 'Saving...' : 'Get Started'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
