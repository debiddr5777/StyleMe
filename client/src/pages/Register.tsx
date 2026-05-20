import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Loader } from 'lucide-react'
import { authApi } from '../utils/api'
import { useAuthStore } from '../store'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await authApi.register({ email, password })
      setAuth(data.user, data.token, data.refreshToken)
      navigate('/onboarding')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Sparkles size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">StyleAI</span>
        </Link>

        <div className="card">
          <h1 className="text-xl font-bold mb-2">Create Account</h1>
          <p className="text-text-secondary text-sm mb-4">Join to get personalized outfit suggestions</p>

          {error && <div className="mb-3 p-2 bg-accent/10 text-accent text-sm rounded">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ chars)" className="input" minLength={8} required />
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <Loader size={18} className="inline mr-2 animate-spin" /> : null}
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Already have an account? <Link to="/login" className="text-accent">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}