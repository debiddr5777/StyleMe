import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Shirt, Palette, Zap, ArrowRight, Check } from 'lucide-react'

const features = [
  {
    icon: Shirt,
    title: 'Smart Wardrobe',
    description: 'Catalog your clothes with AI-powered image recognition and automatic categorization.'
  },
  {
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'Get personalized outfit suggestions based on your style, occasion, and weather.'
  },
  {
    icon: Palette,
    title: 'Color Coordination',
    description: 'Discover perfect color combinations that complement your existing wardrobe.'
  }
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">StyleAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="btn btn-ghost">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm font-medium mb-6">
              <Zap size={14} />
              AI-Powered Fashion Assistant
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Your Personal
              <span className="block gradient-text">Style Consultant</span>
            </h1>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              Discover perfect outfits tailored to your wardrobe. 
              Get AI recommendations, track your clothes, and never worry about what to wear again.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-4 flex items-center gap-2">
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn btn-secondary text-lg px-8 py-4">
                Sign In
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid md:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <div key={index} className="card card-hover">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose StyleAI?</h2>
          <div className="space-y-4">
            {[
              'AI-powered clothing categorization',
              'Smart outfit recommendations',
              'Color coordination engine',
              'Weather-aware suggestions',
              'Personal style learning',
              'Shopping integration'
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-surface rounded-xl">
                <Check size={20} className="text-success" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center text-text-secondary">
          <p>&copy; 2026 StyleAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}