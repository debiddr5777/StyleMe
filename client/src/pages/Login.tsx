import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Loader } from 'lucide-react'
import { authApi } from '../utils/api'
import { useAuthStore } from '../store'

export default function Login() {
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
      const { data } = await authApi.login({ email, password })
      setAuth(data.user, data.token, data.refreshToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials')
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
          <h1 className="text-xl font-bold mb-2">Welcome back</h1>
          <p className="text-text-secondary text-sm mb-4">Sign in to continue</p>

          {error && <div className="mb-3 p-2 bg-accent/10 text-accent text-sm rounded">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input" required />
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <Loader size={18} className="inline mr-2 animate-spin" /> : <ArrowRight size={18} className="inline mr-2" />}
              Sign In
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-secondary">
            No account? <Link to="/register" className="text-accent">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}