const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        stylePreferences: true,
        colorPreferences: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      stylePreferences: JSON.parse(user.stylePreferences || '[]'),
      colorPreferences: JSON.parse(user.colorPreferences || '[]')
    });
  } catch (error) {
    next(error);
  }
});

router.put('/me', async (req, res, next) => {
  try {
    const { name, gender, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, gender, avatarUrl }
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      gender: user.gender,
      stylePreferences: JSON.parse(user.stylePreferences || '[]'),
      colorPreferences: JSON.parse(user.colorPreferences || '[]'),
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    next(error);
  }
});

router.put('/me/preferences', async (req, res, next) => {
  try {
    const { stylePreferences, colorPreferences } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        stylePreferences: stylePreferences ? JSON.stringify(stylePreferences) : undefined,
        colorPreferences: colorPreferences ? JSON.stringify(colorPreferences) : undefined
      }
    });

    res.json({
      stylePreferences: JSON.parse(user.stylePreferences || '[]'),
      colorPreferences: JSON.parse(user.colorPreferences || '[]')
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;