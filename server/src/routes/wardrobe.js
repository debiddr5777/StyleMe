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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    const $ = cheerio.load(response.data);
    
    const title = $('title').text() || $('[itemprop="name"]').text() || 'Clothing Item';
    const price = $('[itemprop="price"]').attr('content') || $('.price').text() || '';
    const image = $('[itemprop="image"]').attr('content') || 
                $('meta[property="og:image"]').attr('content') || 
                $('img.product-image').attr('src') || 
                $('img').first().attr('src') || '';
    const description = $('meta[name="description"]').attr('content') || '';
    
    return { title: title.trim().substring(0, 100), price, image, description };
  } catch (e) {
    return { title: 'Item', price: '', image: '', description: '' };
  }
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