const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const axios = require('axios');
const cheerio = require('cheerio');

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

async function scrapeProduct(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000
    });
    const $ = cheerio.load(response.data);
    
    // Title extraction
    const title = $('title').text() || $('[itemprop="name"]').text() || 
                  $('h1').first().text() || 'Clothing Item';
    const price = $('[itemprop="price"]').attr('content') || 
                  $('[itemprop="price"]').first().text() || 
                  $('.price').text() || 
                  $('[data-price]').attr('data-price') || '';
    const description = $('meta[name="description"]').attr('content') || 
                       $('[itemprop="description"]').text() || '';

    // Smart image extraction
    const image = findBestProductImage($, url);
    
    return { title: title.trim().substring(0, 100), price, image, description };
  } catch (e) {
    console.error('Scrape error:', e.message);
    return { title: 'Item', price: '', image: '', description: '' };
  }
}

function findBestProductImage($, pageUrl) {
  const allImages = [];
  
  // Common product image selectors for major e-commerce sites
  const selectors = [
    // Schema.org
    '[itemprop="image"]',
    '[data-product-image]',
    '[data-image]',
    // Class-based selectors
    '.product-image img',
    '.product-image',
    '.gallery-image img',
    '.gallery-image',
    '.pdp-image img',
    '.pdp-image',
    'img.product-image',
    'img[data-product]',
    // Pattern-based
    '[class*="product-image"] img',
    '[class*="gallery"] img',
    '[class*="pdp-image"] img',
    '[class*="main-image"] img',
    '[class*="hero-image"] img',
    '[id*="product-image"]',
    '[id*="main-image"]',
    'img[class*="product"]',
    'img[class*="item"]',
    'img[src*="product"]',
    // Amazon
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    // Myntra
    '.pdp-product-image-container img',
    '.pdp-image-slider img',
    // Flipkart
    '._396cs4 img',
    '._2KarZ0 img',
    // Generic
    '[class*="pdp"] img',
    // OG image as fallback
    'meta[property="og:image"]',
  ];

  // Try specific selectors first
  for (const selector of selectors) {
    if (selector.startsWith('meta')) {
      const content = $(selector).attr('content');
      if (content) {
        allImages.push({ url: content, width: 1000 });
      }
    } else {
      $(selector).each((i, el) => {
        const $el = $(el);
        let src = $el.attr('src') || $el.attr('data-src') || $el.attr('data-a-dynamic-image') || '';
        
        if (src && !src.startsWith('data:')) {
          if (src.includes('{') && src.includes('}')) {
            try {
              const dynamicImages = JSON.parse(src);
              Object.keys(dynamicImages).forEach(key => allImages.push({ url: key, width: 1000 }));
              return;
            } catch {}
          }
          
          const width = parseInt($el.attr('width') || '0') || extractDimensionFromUrl(src);
          allImages.push({ url: src, width });
        }
      });
    }
    if (allImages.length > 0) break;
  }

  // If no specific selector worked, analyze all images
  if (allImages.length === 0) {
    $('img').each((i, el) => {
      const $el = $(el);
      let src = $el.attr('src') || $el.attr('data-src') || '';
      
      if (src && !src.startsWith('data:')) {
        const width = parseInt($el.attr('width') || '0') || extractDimensionFromUrl(src);
        const height = parseInt($el.attr('height') || '0') || extractDimensionFromUrl(src, true);
        
        if (width >= 200 || height >= 200) {
          const isLikelyProduct = !/(logo|icon|sprite|btn|arrow|check|star|menu|nav|bg|background|banner|ad-|advertisement)/i.test(src);
          allImages.push({ url: src, width: isLikelyProduct ? width : width * 0.1 });
        }
      }
    });
  }

  // Sort by width and return best
  allImages.sort((a, b) => b.width - a.width);
  
  for (const img of allImages) {
    const url = img.url;
    if (isGoodProductImage(url)) {
      return normalizeImageUrl(url, pageUrl);
    }
  }
  
  return allImages.length > 0 ? normalizeImageUrl(allImages[0].url, pageUrl) : '';
}

function extractDimensionFromUrl(url, isHeight = false) {
  const dimMatch = url.match(/(\d+)[xX](\d+)/);
  if (dimMatch) {
    return isHeight ? parseInt(dimMatch[2]) : parseInt(dimMatch[1]);
  }
  return 0;
}

function isGoodProductImage(url) {
  if (!url) return false;
  
  const badPatterns = [
    /logo/i, /icon/i, /sprite/i, /btn/i, /button/i, /arrow/i,
    /star/i, /rating/i, /menu/i, /nav/i, /banner/i, /advertisement/i,
    /ad-/i, /pixel/i, /tracking/i, /spacer/i, /placeholder/i,
    /\.gif$/i, /data:/i, /base64/i, /swatch/i, /tiny/i, /thumb/i
  ];
  
  const goodPatterns = [
    /product/i, /pdp/i, /gallery/i, /image/i, /photo/i, 
    /large/i, /zoom/i, /full/i, /main/i, /hero/i,
    /\d{3,}/  // URLs with 3+ digit numbers (likely dimensions)
  ];
  
  const isBad = badPatterns.some(p => p.test(url));
  const hasGood = goodPatterns.some(p => p.test(url));
  
  return !isBad || hasGood;
}

function normalizeImageUrl(url, pageUrl) {
  if (!url) return '';
  
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  if (url.startsWith('/')) {
    try {
      const base = new URL(pageUrl);
      return base.origin + url;
    } catch {
      return url;
    }
  }
  
  return url;
}

router.get('/', async (req, res, next) => {
  try {
    const { category, favorite, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.userId };
    if (category) where.category = category;
    if (favorite === 'true') where.isFavorite = true;

    const items = await prisma.wardrobeItem.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const parsed = items.map(i => ({
      ...i, season: JSON.parse(i.season || '[]'),
      tags: JSON.parse(i.tags || '[]'),
      styleTags: JSON.parse(i.styleTags || '[]'),
      colors: JSON.parse(i.colors || '[]')
    }));

    res.json({ items: parsed, pagination: { page: parseInt(page), limit: parseInt(limit), total: items.length, pages: 1 } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.wardrobeItem.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ ...item, season: JSON.parse(item.season || '[]'), tags: JSON.parse(item.tags || '[]'), styleTags: JSON.parse(item.styleTags || '[]'), colors: JSON.parse(item.colors || '[]') });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { productUrl, imageUrl, category, name, brand } = req.body;
    
    let finalImageUrl = imageUrl || '';
    let finalName = name || '';
    let finalBrand = brand || '';
    
    if (productUrl) {
      const scraped = await scrapeProduct(productUrl);
      if (scraped.image && !finalImageUrl) finalImageUrl = scraped.image;
      if (scraped.title && !finalName) finalName = scraped.title;
    }
    
    if (!finalImageUrl) {
      const categories = ['shirts', 'pants', 'dresses', 'shoes', 'accessories', 'outerwear'];
      const fallbackImages = {
        shirts: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
        pants: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400',
        dresses: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
        shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        accessories: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400',
        outerwear: 'https://images.unsplash.com/photo-1591047139829-d91aecb6c770?w=400'
      };
      const cat = category || 'shirts';
      finalImageUrl = fallbackImages[cat] || fallbackImages.shirts;
    }
    
    if (!finalName) finalName = category ? category.charAt(0).toUpperCase() + category.slice(1) + ' Item' : 'Clothing Item';

    const item = await prisma.wardrobeItem.create({
      data: {
        userId: req.user.userId,
        category: category || 'shirts',
        imageUrl: finalImageUrl,
        productUrl: productUrl || '',
        name: finalName,
        brand: finalBrand,
        season: '[]',
        tags: '[]',
        styleTags: '[]',
        colors: '[]'
      }
    });

    res.status(201).json({ ...item, season: [], tags: [], styleTags: [], colors: [] });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.wardrobeItem.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const { category, productUrl, brand, name, season, tags, styleTags } = req.body;
    const item = await prisma.wardrobeItem.update({
      where: { id: req.params.id },
      data: {
        category: category || existing.category,
        productUrl: productUrl !== undefined ? productUrl : existing.productUrl,
        brand: brand !== undefined ? brand : existing.brand,
        name: name !== undefined ? name : existing.name,
        season: season ? JSON.stringify(season) : existing.season,
        tags: tags ? JSON.stringify(tags) : existing.tags,
        styleTags: styleTags ? JSON.stringify(styleTags) : existing.styleTags
      }
    });

    res.json({ ...item, season: JSON.parse(item.season || '[]'), tags: JSON.parse(item.tags || '[]'), styleTags: JSON.parse(item.styleTags || '[]'), colors: JSON.parse(item.colors || '[]') });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.wardrobeItem.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    await prisma.wardrobeItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item deleted' });
  } catch (error) { next(error); }
});

router.post('/:id/favorite', async (req, res, next) => {
  try {
    const existing = await prisma.wardrobeItem.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    const item = await prisma.wardrobeItem.update({ where: { id: req.params.id }, data: { isFavorite: !existing.isFavorite } });
    res.json({ ...item, season: JSON.parse(item.season || '[]'), tags: JSON.parse(item.tags || '[]'), styleTags: JSON.parse(item.styleTags || '[]'), colors: JSON.parse(item.colors || '[]') });
  } catch (error) { next(error); }
});

module.exports = router;