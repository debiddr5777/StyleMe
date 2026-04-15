const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const { occasion, styleType, favorite, page = 1, limit = 20 } = req.query;
    
    const where = { userId: req.user.userId };
    
    if (occasion) where.occasion = occasion;
    if (styleType) where.styleType = styleType;
    if (favorite === 'true') where.isFavorite = true;

    const outfits = await prisma.outfit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const parsedOutfits = outfits.map(outfit => ({
      ...outfit,
      items: JSON.parse(outfit.items || '[]')
    }));

    res.json({
      outfits: parsedOutfits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: outfits.length,
        pages: 1
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const outfit = await prisma.outfit.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!outfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    res.json({
      ...outfit,
      items: JSON.parse(outfit.items || '[]')
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { items, occasion, styleType, season } = req.body;

    if (!items || !Array.isArray(items) || items.length < 2) {
      return res.status(400).json({ error: 'Outfit must have at least 2 items' });
    }

    const outfit = await prisma.outfit.create({
      data: {
        userId: req.user.userId,
        items: JSON.stringify(items),
        occasion,
        styleType,
        season
      }
    });

    res.status(201).json({
      ...outfit,
      items: JSON.parse(outfit.items)
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existingOutfit = await prisma.outfit.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!existingOutfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    const { items, occasion, styleType, season, rating } = req.body;

    const outfit = await prisma.outfit.update({
      where: { id: req.params.id },
      data: {
        items: items ? JSON.stringify(items) : existingOutfit.items,
        occasion: occasion || existingOutfit.occasion,
        styleType: styleType || existingOutfit.styleType,
        season: season || existingOutfit.season,
        rating: rating !== undefined ? rating : existingOutfit.rating
      }
    });

    res.json({
      ...outfit,
      items: JSON.parse(outfit.items || '[]')
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existingOutfit = await prisma.outfit.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!existingOutfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    await prisma.outfit.delete({ where: { id: req.params.id } });

    res.json({ message: 'Outfit deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/rate', async (req, res, next) => {
  try {
    const existingOutfit = await prisma.outfit.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!existingOutfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const outfit = await prisma.outfit.update({
      where: { id: req.params.id },
      data: { rating }
    });

    res.json({
      ...outfit,
      items: JSON.parse(outfit.items || '[]')
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/favorite', async (req, res, next) => {
  try {
    const existingOutfit = await prisma.outfit.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!existingOutfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    const outfit = await prisma.outfit.update({
      where: { id: req.params.id },
      data: { isFavorite: !existingOutfit.isFavorite }
    });

    res.json({
      ...outfit,
      items: JSON.parse(outfit.items || '[]')
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;