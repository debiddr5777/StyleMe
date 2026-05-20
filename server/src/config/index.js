module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    expiresIn: '7d',
    refreshExpiresIn: '30d'
  },
  upload: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  recommendations: {
    maxOutfits: 5,
    minCompatibilityScore: 0.6
  },
  categories: [
    'shirts',
    'pants',
    'dresses',
    'shoes',
    'accessories',
    'outerwear',
    'tops',
    'bottoms'
  ],
  styles: [
    'Casual',
    'Formal',
    'Business Casual',
    'Sporty',
    'Streetwear',
    'Elegant',
    'Boho',
    'Minimalist'
  ],
  occasions: [
    'Work',
    'Party',
    'Date',
    'Casual Outing',
    'Formal Event',
    'Sports'
  ],
  seasons: ['Spring', 'Summer', 'Fall', 'Winter', 'All Season']
};