const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

router.post('/classify', async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const mockCategories = [
      { category: 'shirts', confidence: 0.85 },
      { category: 'tops', confidence: 0.72 },
      { category: 'dresses', confidence: 0.45 },
      { category: 'outerwear', confidence: 0.23 }
    ];

    const topCategory = mockCategories.reduce((max, curr) => 
      curr.confidence > max.confidence ? curr : max
    );

    res.json({
      category: topCategory.category,
      confidence: topCategory.confidence,
      allPredictions: mockCategories
    });
  } catch (error) {
    next(error);
  }
});

router.post('/extract-colors', async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const mockColors = [
      { hex: '#1A1A2E', name: 'Navy', percentage: 45 },
      { hex: '#FFFFFF', name: 'White', percentage: 25 },
      { hex: '#E94560', name: 'Coral', percentage: 15 },
      { hex: '#A0A0B8', name: 'Gray', percentage: 10 },
      { hex: '#2D2D4A', name: 'Dark Purple', percentage: 5 }
    ];

    res.json({
      dominantColor: mockColors[0].hex,
      colors: mockColors
    });
  } catch (error) {
    next(error);
  }
});

router.post('/compatibility', async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length < 2) {
      return res.status(400).json({ error: 'At least 2 items required' });
    }

    const baseScore = 0.7;
    const randomFactor = Math.random() * 0.25;
    const score = Math.min(0.99, baseScore + randomFactor);

    const colorHarmony = score > 0.75 ? 'Good complementary colors' : 'Neutral color balance';
    const styleMatch = score > 0.7 ? 'Styles complement each other' : 'Basic coordination';
    const occasionFit = score > 0.65 ? 'Appropriate for selected occasion' : 'Versatile combination';

    const reasons = [colorHarmony, styleMatch, occasionFit].filter(() => Math.random() > 0.3);

    res.json({
      compatibilityScore: score,
      reasons
    });
  } catch (error) {
    next(error);
  }
});

router.post('/scrape', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      const title = $('title').text() || $('[itemprop="name"]').text() || 'Product';
      const price = $('[itemprop="price"]').attr('content') || 
                    $('.price').text() || 
                    $('[data-price]').attr('data-price') || '';
      const image = $('[itemprop="image"]').attr('content') || 
                  $('meta[property="og:image"]').attr('content') || 
                  $('img.product-image').attr('src') || '';

      res.json({
        title: title.trim(),
        price: price.trim(),
        image: image.trim(),
        url
      });
    } catch (scrapeError) {
      res.json({
        title: 'Product',
        price: '',
        image: '',
        url,
        note: 'Could not fetch full details'
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;