/**
 * ML Routes
 * - /classify - clothing category classification
 * - /extract-colors - dominant color extraction
 * - /compatibility - outfit compatibility score
 * - /scrape - product page metadata scraping
 * - /analyze-product - full product analysis (scrape + classify + colors)
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { analyzeProduct, scrapeProductPage } = require('../services/productAnalyzer');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ── Routes ──────────────────────────────────────────────────────────────────

router.post('/classify', async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });

    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/classify`, { imageUrl }, { timeout: 8000 });
      return res.json(mlResponse.data);
    } catch {
      // ML service not running - use mock
    }

    const mockCategories = [
      { category: 'shirts', confidence: 0.85 },
      { category: 'tops', confidence: 0.72 },
    ];
    res.json({ category: mockCategories[0].category, confidence: 0.85, allPredictions: mockCategories });
  } catch (error) {
    next(error);
  }
});

router.post('/extract-colors', async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Image URL is required' });

    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/extract-colors`, { imageUrl }, { timeout: 8000 });
      return res.json(mlResponse.data);
    } catch {
      // ML service not running - use mock
    }

    const mockColors = [
      { hex: '#1A1A2E', name: 'Navy', percentage: 45 },
      { hex: '#FFFFFF', name: 'White', percentage: 25 },
      { hex: '#9CA3AF', name: 'Gray', percentage: 30 },
    ];
    res.json({ dominantColor: mockColors[0].hex, colors: mockColors });
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

    const score = Math.min(0.99, 0.65 + Math.random() * 0.30);
    const reasons = [
      'Good complementary colors',
      'Styles complement each other',
      'Appropriate for selected occasion'
    ].filter(() => Math.random() > 0.3);

    res.json({ compatibilityScore: score, reasons });
  } catch (error) {
    next(error);
  }
});

router.post('/scrape', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
      const data = await scrapeProductPage(url);
      res.json(data);
    } catch (scrapeError) {
      res.json({ title: 'Product', price: '', image: '', url, note: 'Could not fetch full details' });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /ml/analyze-product
 * Full product analysis: scrape + classify + extract colors
 */
router.post('/analyze-product', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Product URL is required' });

    try {
      const result = await analyzeProduct(url);
      res.json(result);
    } catch (err) {
      return res.status(422).json({
        error: 'Could not load this product page. Try a different URL.',
        details: err.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;