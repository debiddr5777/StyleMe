const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const prisma = new PrismaClient();

const FALLBACK_IMAGES = {
  shirts: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', 'https://images.unsplash.com/photo-1602810318383-e386cc2e2d72?w=400', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be3b?w=400'],
  pants: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400', 'https://images.unsplash.com/photo-1624378439575-d8705f7c98aa?w=400', 'https://images.unsplash.com/photo-1552902055-4f4d13fb1d33?w=400'],
  shoes: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400', 'https://images.unsplash.com/photo-1608231387042-090932进
```

Let me fix this - I'll write a proper simplified recommendations route.
</think>


<minimax:tool_call>
<invoke name="write">
<parameter name="content">const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const FALLBACKS = {
  shirts: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', 'https://images.unsplash.com/photo-1602810318383-e386cc2e2d72?w=400', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be3b?w=400'],
  pants: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400', 'https://images.unsplash.com/photo-1624378439575-d8705f7c98aa?w=400', 'https://images.unsplash.com/photo-1552902055-4f4d13fb1d33?w=400'],
  shoes: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400', 'https://images.unsplash.com/photo-1605348531560-64af8e5ad2ce?w=400'],
  accessories: ['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400', 'https://images.unsplash.com/photo-1611923134234-f0d4f0bab77a?w=400', 'https://images.unsplash.com/photo-1590534247854-e97d5e11c00c?w=400'],
  outerwear: ['https://images.unsplash.com/photo-1591047139829-d91aecb6c770?w=400', 'https://images.unsplash.com/photo-1548126032-0799e2d84b71?w=400', 'https://images.unsplash.com/photo-1539533113208-f6df3cc1d777?w=400'],
  dresses: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400']
};

function getFallbackImage(category) {
  const images = FALLBACKS[category] || FALLBACKS.shirts;
  return images[Math.floor(Math.random() * images.length)];
}

function generateOutfitFromItems(userItems) {
  const categories = ['shirts', 'pants', 'shoes', 'accessories', 'outerwear'];
  const outfit = [];
  let score = 0;

  for (const cat of categories) {
    const userItem = userItems.find(i => i.category === cat);
    if (userItem) {
      outfit.push({ ...userItem, isUserItem: true });
      score += 0.85;
    } else {
      outfit.push({
        id: `fallback-${cat}-${Date.now()}`,
        category: cat,
        name: `${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
        imageUrl: getFallbackImage(cat),
        isUserItem: false
      });
      score += 0.5;
    }
  }

  return { items: outfit, score: score / categories.length };
}

router.post('/generate', async (req, res, next) => {
  try {
    const { occasion, styleType, season } = req.body;
    
    const userItems = await prisma.wardrobeItem.findMany({
      where: { userId: req.user.userId }
    });

    if (userItems.length === 0) {
      const defaultOutfit = generateOutfitFromItems([]);
      return res.json({ outfits: [defaultOutfit], message: 'No items yet - using style suggestions' });
    }

    const outfits = [];
    for (let i = 0; i < 3; i++) {
      outfits.push(generateOutfitFromItems(userItems));
    }
    
    for (const outfit of outfits) {
      await prisma.suggestion.create({
        data: {
          userId: req.user.userId,
          suggestedItems: JSON.stringify(outfit.items.map(i => ({ id: i.id, category: i.category }))),
          compatibilityScore: outfit.score,
          reason: outfit.items.filter(i => i.isUserItem).length > 0 
            ? `Uses ${outfit.items.filter(i => i.isUserItem).length} of your items` 
            : 'Style suggestions based on your preferences',
          occasion,
          styleType
        }
      });
    }

    res.json({ outfits });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const suggestions = await prisma.suggestion.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });
    res.json({ suggestions: suggestions.map(s => ({ ...s, suggestedItems: JSON.parse(s.suggestedItems || '[]') })), pagination: { page: parseInt(page), limit: parseInt(limit), total: suggestions.length, pages: 1 } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;