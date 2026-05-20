import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Loader, Check, Settings, LogOut } from 'lucide-react'
import { userApi } from '../utils/api'
import { useAuthStore, useUIStore } from '../store'

const genders = ['Male', 'Female', 'Unisex', 'Prefer not to say']
const allStyles = ['Casual', 'Formal', 'Business Casual', 'Sporty', 'Streetwear', 'Elegant', 'Boho', 'Minimalist']
const allColors = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#1A1A2E' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Red', hex: '#E94560' },
  { name: 'Blue', hex: '#0066CC' }
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuthStore()
  const addToast = useUIStore((state) => state.addToast)
  
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    gender: user?.gender || '',
    stylePreferences: user?.stylePreferences || [] as string[],
    colorPreferences: user?.colorPreferences || [] as string[]
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await userApi.updateProfile({ name: formData.name, gender: formData.gender })
      await userApi.updatePreferences({
        stylePreferences: formData.stylePreferences,
        colorPreferences: formData.colorPreferences
      })
      updateUser(formData)
      addToast('Profile updated', 'success')
    } catch (error) {
      addToast('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      stylePreferences: prev.stylePreferences.includes(style)
        ? prev.stylePreferences.filter(s => s !== style)
        : [...prev.stylePreferences, style]
    }))
  }

  const toggleColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colorPreferences: prev.colorPreferences.includes(color)
        ? prev.colorPreferences.filter(c => c !== color)
        : [...prev.colorPreferences, color]
    }))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-text-secondary">Manage your account</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Account Info</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="input pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input pl-12 bg-background cursor-not-allowed opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <div className="flex gap-2">
              {genders.map(gender => (
                <button
                  key={gender}
                  onClick={() => setFormData(prev => ({ ...prev, gender }))}
                  className={`px-4 py-2 rounded-xl border transition-all ${
                    formData.gender === gender
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Style Preferences</h2>
        <p className="text-sm text-text-secondary mb-4">Select your preferred styles</p>
        
        <div className="flex flex-wrap gap-2">
          {allStyles.map(style => (
            <button
              key={style}
              onClick={() => toggleStyle(style)}
              className={`px-4 py-2 rounded-full border transition-all ${
                formData.stylePreferences.includes(style)
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border hover:border-accent'
              }`}
            >
              {formData.stylePreferences.includes(style) && <Check size={14} className="inline mr-1" />}
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Color Preferences</h2>
        <p className="text-sm text-text-secondary mb-4">Select your favorite colors</p>
        
        <div className="flex flex-wrap gap-3">
          {allColors.map(color => (
            <button
              key={color.hex}
              onClick={() => toggleColor(color.hex)}
              className={`w-12 h-12 rounded-full border-2 transition-all ${
                formData.colorPreferences.includes(color.hex)
                  ? 'border-accent scale-110'
                  : 'border-border hover:border-accent'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex-1"
        >
          {saving ? <Loader size={18} className="inline mr-2 animate-spin" /> : <Check size={18} className="inline mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}