const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Category style scores - how formal/sporty each category is (0-10, 10=formal, 0=sporty)
const CATEGORY_STYLES = {
  // Male
  tshirt: 2, shirt: 5, dress_shirt: 9, polo: 5, henley: 3,
  jeans: 3, chinos: 5, dress_pants: 8, shorts: 1, joggers: 2,
  sneakers: 3, loafers: 5, oxfords: 8, boots: 5, sandals: 1,
  blazer: 9, suit_jacket: 10, denim_jacket: 4, leather_jacket: 5, hoodie: 2,
  cardigan: 4, bomber: 3, windbreaker: 2, sports_jacket: 1,
  sports_tee: 1, athletic_shorts: 0, track_pants: 1, running_shoes: 1,
  watch: 6, cap: 1, belt: 5, sunglasses: 3, tie: 10, cufflinks: 10,
  // Female
  blouse: 5, sweater: 4, crop_top: 2, tank_top: 1, cami_top: 3,
  dress: 7, mini_skirt: 3, midi_skirt: 6, pencil_skirt: 8, wide_leg_pants: 5,
  leggings: 2, heels: 8, flats: 4, ballet_flats: 4, ankle_boots: 5,
  sequin_top: 7, off_shoulder: 6, elegant_top: 8,
  clutch: 8, jewelry: 5, bag: 5, tote: 4,
};

// Occasion style ranges (what formality level is appropriate)
const OCCASION_STYLES = {
  casual: { min: 1, max: 5 },
  workout: { min: 0, max: 2 },
  party: { min: 4, max: 8 },
  date: { min: 4, max: 8 },
  work: { min: 6, max: 10 },
  formal: { min: 9, max: 10 },
};

// Outfit compositions per occasion (which slots are needed, core vs optional)
const OUTFIT_COMPOSITIONS = {
  casual: {
    core: ['tops', 'bottoms', 'footwear'],
    optional: ['outerwear', 'accessories'],
    description: 'Relaxed everyday look'
  },
  workout: {
    core: ['tops', 'bottoms', 'footwear'],
    optional: ['outerwear'],
    description: 'Athletic and ready to move'
  },
  party: {
    core: ['tops', 'bottoms', 'footwear'],
    optional: ['outerwear', 'accessories'],
    description: 'Stand-out night out look'
  },
  date: {
    core: ['tops', 'bottoms', 'footwear'],
    optional: ['outerwear', 'accessories'],
    description: 'Charming and stylish'
  },
  work: {
    core: ['tops', 'bottoms', 'footwear'],
    optional: ['outerwear', 'accessories'],
    description: 'Professional and polished'
  },
  formal: {
    core: ['tops', 'bottoms', 'footwear'],
    optional: ['outerwear', 'accessories'],
    description: 'Elegant and sophisticated'
  }
};

// Fashion rules - valid categories per slot per occasion
const FASHION_RULES = {
  male: {
    casual: { tops: ['tshirt', 'shirt', 'hoodie', 'polo', 'henley'], bottoms: ['jeans', 'chinos', 'shorts', 'joggers'], footwear: ['sneakers', 'loafers', 'sandals', 'boots'], outerwear: ['denim_jacket', 'bomber', 'cardigan'], accessories: ['watch', 'cap', 'belt', 'sunglasses'] },
    work: { tops: ['dress_shirt', 'shirt', 'polo'], bottoms: ['dress_pants', 'chinos'], footwear: ['oxfords', 'loafers', 'boots'], outerwear: ['blazer', 'suit_jacket'], accessories: ['watch', 'tie', 'belt', 'wallet'] },
    formal: { tops: ['dress_shirt'], bottoms: ['dress_pants'], footwear: ['oxfords'], outerwear: ['suit_jacket', 'blazer'], accessories: ['tie', 'cufflinks', 'watch'] },
    party: { tops: ['shirt', 'dress_shirt', 'henley'], bottoms: ['jeans', 'chinos', 'dress_pants'], footwear: ['sneakers', 'boots', 'loafers'], outerwear: ['blazer', 'leather_jacket', 'denim_jacket'], accessories: ['watch', 'sunglasses'] },
    date: { tops: ['shirt', 'dress_shirt', 'polo'], bottoms: ['jeans', 'chinos'], footwear: ['sneakers', 'loafers', 'boots'], outerwear: ['blazer', 'cardigan', 'denim_jacket'], accessories: ['watch', 'belt'] },
    workout: { tops: ['sports_tee', 'tank_top'], bottoms: ['athletic_shorts', 'track_pants', 'shorts'], footwear: ['running_shoes', 'sneakers'], outerwear: ['windbreaker', 'hoodie'], accessories: ['cap'] }
  },
  female: {
    casual: { tops: ['tshirt', 'blouse', 'sweater', 'crop_top', 'tank_top'], bottoms: ['jeans', 'skirt', 'shorts', 'leggings'], footwear: ['sneakers', 'sandals', 'flats', 'boots'], outerwear: ['denim_jacket', 'cardigan', 'hoodie'], accessories: ['jewelry', 'bag', 'scarf'] },
    work: { tops: ['blouse', 'dress_shirt', 'sweater', 'cami_top'], bottoms: ['pencil_skirt', 'dress_pants', 'midi_skirt', 'jeans'], footwear: ['heels', 'flats', 'boots'], outerwear: ['blazer', 'cardigan'], accessories: ['jewelry', 'bag', 'watch'] },
    formal: { tops: ['blouse', 'elegant_top', 'cami_top'], bottoms: ['dress', 'dress_pants', 'midi_skirt'], footwear: ['heels', 'flats'], outerwear: ['blazer'], accessories: ['clutch', 'jewelry'] },
    party: { tops: ['sequin_top', 'blouse', 'crop_top', 'off_shoulder'], bottoms: ['mini_skirt', 'leather_pants', 'jeans', 'skirt'], footwear: ['heels', 'boots', 'sandals'], outerwear: ['leather_jacket', 'sequin_top'], accessories: ['clutch', 'jewelry'] },
    date: { tops: ['blouse', 'crop_top', 'sweater', 'off_shoulder'], bottoms: ['jeans', 'skirt', 'leggings'], footwear: ['heels', 'boots', 'flats'], outerwear: ['denim_jacket', 'cardigan', 'blazer'], accessories: ['jewelry', 'bag'] },
    workout: { tops: ['tank_top', 'sports_tee', 'cami_top'], bottoms: ['leggings', 'athletic_shorts', 'shorts'], footwear: ['sneakers'], outerwear: ['hoodie', 'windbreaker'], accessories: ['yoga_mat'] }
  }
};

// Fallback images - verified working Unsplash images
const FALLBACK_IMAGES = {
  male: {
    tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
    shirt: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80',
    dress_shirt: 'https://images.unsplash.com/photo-1602810318383-e386cc2e2d72?w=400&q=80',
    polo: 'https://images.unsplash.com/photo-1625910513413-5fc45a6c2e3e?w=400&q=80',
    jeans: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
    chinos: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80',
    shorts: 'https://images.unsplash.com/photo-1562579870-4cba37b3a5b0?w=400&q=80',
    sneakers: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    boots: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&q=80',
    loafers: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&q=80',
    blazer: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80',
    denim_jacket: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&q=80',
    leather_jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80',
    sports_tee: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&q=80',
    athletic_shorts: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80',
    joggers: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&q=80',
    default: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80'
  },
  female: {
    tshirt: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80',
    blouse: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&q=80',
    sweater: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80',
    dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
    jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80',
    skirt: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80',
    mini_skirt: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80',
    sneakers: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80',
    heels: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80',
    boots: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    flats: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80',
    blazer: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80',
    denim_jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    crop_top: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80',
    sequin_top: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80',
    leggings: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80',
    cardigan: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80',
    default: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80'
  }
};

// Category normalization
const CATEGORY_MAP = {
  // Male
  shirts: 'tshirt', shirt: 'tshirt', tshirt: 'tshirt',
  jeans: 'jeans', denim: 'jeans', pants: 'jeans',
  chinos: 'chinos', trousers: 'chinos', dress_pants: 'dress_pants',
  shorts: 'shorts', joggers: 'joggers',
  sneakers: 'sneakers', shoes: 'sneakers', tennis: 'sneakers',
  boots: 'boots', loafers: 'loafers', sandals: 'sandals',
  blazer: 'blazer', suit_jacket: 'blazer',
  denim_jacket: 'denim_jacket', leather_jacket: 'leather_jacket',
  hoodie: 'hoodie', sweatshirt: 'hoodie', dress_shirt: 'dress_shirt',
  polo: 'polo', cardigan: 'cardigan', sweater: 'sweater',
  sports_tee: 'sports_tee', athletic_shorts: 'athletic_shorts',
  // Female
  blouse: 'blouse', top: 'blouse', tunic: 'blouse',
  dress: 'dress', gown: 'dress',
  skirt: 'skirt', mini_skirt: 'mini_skirt', midi_skirt: 'skirt',
  leggings: 'leggings', yoga_pants: 'leggings',
  heels: 'heels', pumps: 'heels', high_heels: 'heels',
  flats: 'flats', ballet_flats: 'flats',
  crop_top: 'crop_top', tank_top: 'tank_top', cami_top: 'cami_top',
  sequin_top: 'sequin_top', off_shoulder: 'off_shoulder',
  jewelry: 'jewelry', bag: 'bag', handbag: 'bag',
  clutch: 'clutch', scarf: 'scarf',
};

function normalizeCategory(category) {
  if (!category) return null;
  const normalized = category.toLowerCase().replace(/[^a-z]/g, '_');
  return CATEGORY_MAP[normalized] || CATEGORY_MAP[category.toLowerCase()] || normalized;
}

function getStyleScore(category) {
  const norm = normalizeCategory(category);
  return CATEGORY_STYLES[norm] || 5; // default 5 (neutral)
}

function getFallbackImage(gender, category) {
  const images = FALLBACK_IMAGES[gender] || FALLBACK_IMAGES.male;
  const norm = normalizeCategory(category);
  
  // Try exact match
  if (images[norm]) return images[norm];
  
  // Try partial match
  for (const [key, url] of Object.entries(images)) {
    if (key.includes(norm) || norm.includes(key)) {
      return url;
    }
  }
  
  return images.default;
}

function isItemAppropriateForOccasion(category, occasion) {
  const styleScore = getStyleScore(category);
  const occasionRange = OCCASION_STYLES[occasion] || OCCASION_STYLES.casual;
  
  // Calculate appropriateness (0-1)
  if (styleScore < occasionRange.min - 2 || styleScore > occasionRange.max + 2) {
    return { appropriate: false, score: 0 };
  }
  
  // Check if within acceptable range
  if (styleScore >= occasionRange.min && styleScore <= occasionRange.max) {
    const center = (occasionRange.min + occasionRange.max) / 2;
    const distance = Math.abs(styleScore - center);
    const maxDistance = (occasionRange.max - occasionRange.min) / 2;
    return { appropriate: true, score: 1 - (distance / maxDistance) };
  }
  
  // Close to range but not quite
  if (styleScore >= occasionRange.min - 1 && styleScore <= occasionRange.max + 1) {
    return { appropriate: true, score: 0.5 };
  }
  
  return { appropriate: false, score: 0 };
}

function buildSmartOutfit(userItems, occasion, gender) {
  const rules = FASHION_RULES[gender]?.[occasion] || FASHION_RULES.male.casual;
  const composition = OUTFIT_COMPOSITIONS[occasion] || OUTFIT_COMPOSITIONS.casual;
  const occasionRange = OCCASION_STYLES[occasion] || OCCASION_STYLES.casual;
  
  const outfit = [];
  const usedIds = new Set();
  let score = 0;
  let suggestions = []; // For suggesting new items
  
  // Score and filter user items
  const scoredUserItems = userItems.map(item => {
    const { appropriate, score: appropriatenessScore } = isItemAppropriateForOccasion(item.category, occasion);
    return { ...item, appropriatenessScore, appropriate };
  });
  
  // Sort by appropriateness for this occasion
  scoredUserItems.sort((a, b) => b.appropriatenessScore - a.appropriatenessScore);
  
  // Build outfit with appropriate items
  const slots = [...composition.core, ...composition.optional];
  
  for (const slot of slots) {
    const validCategories = rules[slot] || [];
    let bestItem = null;
    let isOptional = composition.optional.includes(slot);
    
    // Try to find matching user item
    for (const cat of validCategories) {
      if (bestItem) break;
      
      for (const item of scoredUserItems) {
        const itemNorm = normalizeCategory(item.category);
        if (itemNorm === cat && !usedIds.has(item.id) && item.appropriate) {
          bestItem = { ...item, isUserItem: true };
          usedIds.add(item.id);
          break;
        }
      }
    }
    
    // If not found but category could work with user's item style
    if (!bestItem) {
      // Find any user item that could work but is wrong category
      for (const item of scoredUserItems) {
        if (usedIds.has(item.id)) continue;
        const itemStyle = getStyleScore(item.category);
        
        // If item is close to appropriate but wrong category, suggest it instead
        if (itemStyle >= occasionRange.min && itemStyle <= occasionRange.max) {
          suggestions.push({
            category: item.category,
            why: `Your ${item.name || item.category} could work, but try a ${validCategories[0] || 'alternative'} instead`
          });
          break;
        }
      }
    }
    
    // Create fallback if needed (and item is appropriate to suggest)
    if (!bestItem && validCategories.length > 0) {
      bestItem = {
        id: `fallback-${validCategories[0]}-${Date.now()}`,
        category: validCategories[0],
        name: formatCategoryName(validCategories[0]),
        imageUrl: getFallbackImage(gender, validCategories[0]),
        isUserItem: false
      };
    }
    
    if (bestItem) {
      outfit.push(bestItem);
      if (bestItem.isUserItem) {
        score += bestItem.appropriatenessScore * 0.85;
      } else {
        score += 0.6;
      }
    }
  }
  
  // Remove items that don't fit the occasion well
  const filteredOutfit = outfit.filter(item => {
    if (item.isUserItem) {
      return item.appropriatenessScore > 0.3; // Keep if somewhat appropriate
    }
    return true; // Keep fallbacks
  });
  
  const userItemCount = filteredOutfit.filter(i => i.isUserItem).length;
  const actualScore = filteredOutfit.length > 0 ? score / filteredOutfit.length : 0;
  
  return {
    items: filteredOutfit.map(i => ({
      id: i.id,
      category: i.category,
      name: i.name || formatCategoryName(i.category),
      imageUrl: i.imageUrl || getFallbackImage(gender, i.category),
      isUserItem: i.isUserItem,
      styleScore: i.appropriatenessScore
    })),
    score: actualScore,
    userItemCount,
    suggestions: suggestions.slice(0, 2),
    reason: generateReason(occasion, gender, userItemCount, filteredOutfit.length),
    composition: composition.description
  };
}

function formatCategoryName(cat) {
  if (!cat) return 'Item';
  return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateReason(occasion, gender, userCount, total) {
  const reasons = {
    casual: gender === 'female' ? 'Effortlessly chic for any casual outing' : 'Relaxed and put-together weekend style',
    work: gender === 'female' ? 'Polished look for the office' : 'Sharp professional appearance',
    formal: gender === 'female' ? 'Elegant evening ensemble' : 'Sophisticated formal attire',
    party: gender === 'female' ? 'Glamorous and ready to turn heads' : 'Stand-out look for a night out',
    date: gender === 'female' ? 'Romantic and stylish' : 'Impressive yet approachable',
    workout: gender === 'female' ? 'Functional and cute for the gym' : 'Athletic and ready to perform'
  };
  
  const base = reasons[occasion] || reasons.casual;
  if (userCount > 0) {
    return `${base} • Uses ${userCount} item${userCount > 1 ? 's' : ''} from your wardrobe`;
  }
  return base;
}

router.post('/generate', async (req, res, next) => {
  try {
    const { occasion = 'casual', gender = 'male' } = req.body;
    const userId = req.user.userId;

    const userItems = await prisma.wardrobeItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const outfits = [];
    
    // Generate multiple variations
    for (let i = 0; i < 3; i++) {
      const outfit = buildSmartOutfit(userItems, occasion, gender);
      if (outfit.items.length >= 2) { // Minimum 2 items
        outfits.push(outfit);
      }
    }
    
    // Sort by score and user item usage
    outfits.sort((a, b) => {
      const aScore = a.score + (a.userItemCount * 0.1);
      const bScore = b.score + (b.userItemCount * 0.1);
      return bScore - aScore;
    });

    res.json({ 
      outfits: outfits.slice(0, 3),
      occasion,
      gender
    });
  } catch (error) {
    console.error('Recommendation error:', error);
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
    res.json({ 
      suggestions: suggestions.map(s => ({ 
        ...s, 
        suggestedItems: JSON.parse(s.suggestedItems || '[]') 
      })), 
      pagination: { page: parseInt(page), limit: parseInt(limit), total: suggestions.length, pages: 1 } 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
