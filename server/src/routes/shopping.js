const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get('/search', async (req, res, next) => {
  try {
    const { query, category, minPrice, maxPrice, page = 1 } = req.query;

    const mockProducts = [
      {
        id: '1',
        name: 'Classic White Oxford Shirt',
        brand: 'Everlane',
        price: 75,
        url: 'https://example.com/product/1',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
        retailer: 'Everlane'
      },
      {
        id: '2',
        name: 'Slim Fit Chino Pants',
        brand: 'Bonobos',
        price: 89,
        url: 'https://example.com/product/2',
        image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400',
        retailer: 'Bonobos'
      },
      {
        id: '3',
        name: 'Leather Chelsea Boots',
        brand: 'Thursday Boots',
        price: 199,
        url: 'https://example.com/product/3',
        image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400',
        retailer: 'Thursday Boots'
      },
      {
        id: '4',
        name: 'Merino Wool Sweater',
        brand: 'Reformation',
        price: 148,
        url: 'https://example.com/product/4',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f8942fe6?w=400',
        retailer: 'Reformation'
      },
      {
        id: '5',
        name: 'Denim Jacket',
        brand: 'Levi\'s',
        price: 120,
        url: 'https://example.com/product/5',
        image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93d0?w=400',
        retailer: 'Levi\'s'
      }
    ];

    let products = mockProducts;

    if (query) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.brand.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (minPrice) {
      products = products.filter(p => p.price >= parseInt(minPrice));
    }

    if (maxPrice) {
      products = products.filter(p => p.price <= parseInt(maxPrice));
    }

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        total: products.length,
        pages: 1
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/wishlist', async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    const parsedWishlist = wishlist.map(item => ({
      ...item,
      productData: item.productData ? JSON.parse(item.productData) : null
    }));

    res.json(parsedWishlist);
  } catch (error) {
    next(error);
  }
});

router.post('/wishlist', async (req, res, next) => {
  try {
    const { productUrl, productData } = req.body;

    if (!productUrl) {
      return res.status(400).json({ error: 'Product URL is required' });
    }

    const existingItem = await prisma.wishlist.findFirst({
      where: { userId: req.user.userId, productUrl }
    });

    if (existingItem) {
      return res.status(409).json({ error: 'Item already in wishlist' });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: req.user.userId,
        productUrl,
        productData: productData ? JSON.stringify(productData) : null
      }
    });

    res.status(201).json({
      ...wishlistItem,
      productData: wishlistItem.productData ? JSON.parse(wishlistItem.productData) : null
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/wishlist/:id', async (req, res, next) => {
  try {
    const existingItem = await prisma.wishlist.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }

    await prisma.wishlist.delete({ where: { id: req.params.id } });

    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;