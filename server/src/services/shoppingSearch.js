/**
 * Shopping Search Service
 * Uses SerpAPI Google Shopping to find real product links.
 * Falls back to a curated product catalogue of real retailer deep links.
 */

const axios = require('axios');
const { searchSerpAPI } = require('./trendService');

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// In-memory cache
const productCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ── Curated Product Catalogue ─────────────────────────────────────────────
// Real product links from major retailers — used as fallback when SerpAPI results
// don't have good image/price data.
const PRODUCT_CATALOGUE = {
  'white shirt': [
    { title: 'Oxford Cotton Shirt', brand: 'Uniqlo', price: '$29.90', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80', url: 'https://www.uniqlo.com/us/en/men/tops/shirts', retailer: 'Uniqlo' },
    { title: 'Relaxed Fit Oxford Shirt', brand: 'H&M', price: '$24.99', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2e2d72?w=400&q=80', url: 'https://www2.hm.com/en_us/men/shop-by-product/shirts.html', retailer: 'H&M' },
    { title: 'Crisp White Button Down', brand: 'Everlane', price: '$68', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80', url: 'https://www.everlane.com/collections/mens-shirts', retailer: 'Everlane' },
  ],
  'blue shirt': [
    { title: 'Slim Fit Oxford Shirt - Blue', brand: 'Uniqlo', price: '$29.90', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80', url: 'https://www.uniqlo.com/us/en/men/tops/shirts', retailer: 'Uniqlo' },
    { title: 'Chambray Button Down', brand: 'Zara', price: '$39.99', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2e2d72?w=400&q=80', url: 'https://www.zara.com/us/en/man-shirts-l737.html', retailer: 'Zara' },
  ],
  'jeans': [
    { title: 'Slim Tapered Jeans', brand: 'Levi\'s', price: '$59.50', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80', url: 'https://www.levi.com/US/en_US/clothing/men/jeans', retailer: 'Levi\'s' },
    { title: 'Relaxed Fit Jeans', brand: 'H&M', price: '$34.99', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80', url: 'https://www2.hm.com/en_us/men/shop-by-product/jeans.html', retailer: 'H&M' },
    { title: 'Straight Leg Jeans', brand: 'Uniqlo', price: '$49.90', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80', url: 'https://www.uniqlo.com/us/en/men/bottoms/jeans', retailer: 'Uniqlo' },
  ],
  'chinos': [
    { title: 'Slim Fit Chino Pants', brand: 'Bonobos', price: '$89', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80', url: 'https://bonobos.com/products/stretch-chinos', retailer: 'Bonobos' },
    { title: 'Tapered Chino Trousers', brand: 'Uniqlo', price: '$39.90', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80', url: 'https://www.uniqlo.com/us/en/men/bottoms/pants-and-chinos', retailer: 'Uniqlo' },
    { title: 'Skinny Chino', brand: 'Zara', price: '$45.90', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80', url: 'https://www.zara.com/us/en/man-trousers-and-chinos-l1050.html', retailer: 'Zara' },
  ],
  'sneakers': [
    { title: 'Court Classic Sneakers', brand: 'New Balance', price: '$75', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', url: 'https://www.newbalance.com/shoes/lifestyle/', retailer: 'New Balance' },
    { title: 'Air Force 1 \'07', brand: 'Nike', price: '$110', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80', url: 'https://www.nike.com/w/shoes-5e1x6', retailer: 'Nike' },
    { title: 'Stan Smith Sneakers', brand: 'Adidas', price: '$100', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', url: 'https://www.adidas.com/us/sneakers', retailer: 'Adidas' },
  ],
  'boots': [
    { title: 'Chelsea Boots', brand: 'Thursday Boots', price: '$199', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&q=80', url: 'https://thursdayboots.com/collections/mens-boots', retailer: 'Thursday Boots' },
    { title: 'Leather Chelsea Boot', brand: 'ASOS', price: '$85', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&q=80', url: 'https://www.asos.com/men/shoes-boots/cat/?cid=4209', retailer: 'ASOS' },
  ],
  'loafers': [
    { title: 'Penny Loafer', brand: 'G.H. Bass', price: '$145', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&q=80', url: 'https://www.ghbass.com/category/mens-loafers', retailer: 'G.H. Bass' },
    { title: 'Slip-On Loafer', brand: 'Zara', price: '$65.90', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&q=80', url: 'https://www.zara.com/us/en/man-shoes-l851.html', retailer: 'Zara' },
  ],
  'blazer': [
    { title: 'Slim Fit Blazer', brand: 'Zara', price: '$129', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80', url: 'https://www.zara.com/us/en/man-blazers-l839.html', retailer: 'Zara' },
    { title: 'Unstructured Blazer', brand: 'Banana Republic', price: '$195', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80', url: 'https://bananarepublic.gap.com/browse/category.do?cid=8199', retailer: 'Banana Republic' },
  ],
  'denim jacket': [
    { title: 'Trucker Denim Jacket', brand: 'Levi\'s', price: '$79.50', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&q=80', url: 'https://www.levi.com/US/en_US/clothing/men/jackets-vests', retailer: 'Levi\'s' },
    { title: 'Oversized Denim Jacket', brand: 'H&M', price: '$49.99', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&q=80', url: 'https://www2.hm.com/en_us/ladies/shop-by-product/jackets-and-coats.html', retailer: 'H&M' },
  ],
  'leather jacket': [
    { title: 'Faux Leather Moto Jacket', brand: 'Zara', price: '$119', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80', url: 'https://www.zara.com/us/en/woman-leather-jackets-l1263.html', retailer: 'Zara' },
    { title: 'Slim Leather Jacket', brand: 'AllSaints', price: '$395', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80', url: 'https://www.allsaints.com/us/en/mens/leather-jackets/', retailer: 'AllSaints' },
  ],
  'dress': [
    { title: 'Floral Midi Dress', brand: 'H&M', price: '$39.99', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80', url: 'https://www2.hm.com/en_us/ladies/shop-by-product/dresses.html', retailer: 'H&M' },
    { title: 'Wrap Mini Dress', brand: 'Zara', price: '$65.90', image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80', url: 'https://www.zara.com/us/en/woman-dresses-l1066.html', retailer: 'Zara' },
    { title: 'Linen Shirt Dress', brand: 'Everlane', price: '$118', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80', url: 'https://www.everlane.com/collections/womens-dresses', retailer: 'Everlane' },
  ],
  'heels': [
    { title: 'Block Heel Mules', brand: 'Zara', price: '$79.90', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80', url: 'https://www.zara.com/us/en/woman-high-heel-shoes-l1245.html', retailer: 'Zara' },
    { title: 'Strappy Heeled Sandal', brand: 'Steve Madden', price: '$109', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80', url: 'https://www.stevemadden.com/collections/heels', retailer: 'Steve Madden' },
  ],
  'sandals': [
    { title: 'Strappy Flat Sandal', brand: 'Steve Madden', price: '$69', image: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80', url: 'https://www.stevemadden.com/collections/sandals', retailer: 'Steve Madden' },
    { title: 'Leather Strappy Sandal', brand: 'Zara', price: '$55.90', image: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80', url: 'https://www.zara.com/us/en/woman-flat-sandals-l1245.html', retailer: 'Zara' },
  ],
  'hoodie': [
    { title: 'Essential Oversized Hoodie', brand: 'H&M', price: '$29.99', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80', url: 'https://www2.hm.com/en_us/men/shop-by-product/hoodies-and-sweatshirts.html', retailer: 'H&M' },
    { title: 'Heavyweight Hoodie', brand: 'Champion', price: '$65', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80', url: 'https://www.champion.com/mens-hoodies-sweatshirts', retailer: 'Champion' },
  ],
  'skirt': [
    { title: 'Midi A-Line Skirt', brand: 'H&M', price: '$27.99', image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80', url: 'https://www2.hm.com/en_us/ladies/shop-by-product/skirts.html', retailer: 'H&M' },
    { title: 'Pleated Midi Skirt', brand: 'Zara', price: '$55.90', image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80', url: 'https://www.zara.com/us/en/woman-skirts-l1135.html', retailer: 'Zara' },
  ],
  'polo': [
    { title: 'Slim Fit Polo Shirt', brand: 'Ralph Lauren', price: '$98', image: 'https://images.unsplash.com/photo-1625910513413-5fc45a6c2e3e?w=400&q=80', url: 'https://www.ralphlauren.com/mens-polo-shirts', retailer: 'Ralph Lauren' },
    { title: 'Cotton Piqué Polo', brand: 'Uniqlo', price: '$19.90', image: 'https://images.unsplash.com/photo-1625910513413-5fc45a6c2e3e?w=400&q=80', url: 'https://www.uniqlo.com/us/en/men/tops/polo-shirts', retailer: 'Uniqlo' },
  ],
  'default': [
    { title: 'Classic White T-Shirt', brand: 'Uniqlo', price: '$14.90', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80', url: 'https://www.uniqlo.com/us/en/men/tops/t-shirts', retailer: 'Uniqlo' },
    { title: 'Straight Leg Jeans', brand: 'H&M', price: '$34.99', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80', url: 'https://www2.hm.com/en_us/men/shop-by-product/jeans.html', retailer: 'H&M' },
    { title: 'White Leather Sneakers', brand: 'Adidas', price: '$90', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', url: 'https://www.adidas.com/us/sneakers', retailer: 'Adidas' },
  ],
};

/**
 * Search for real products for a given pairing category.
 * @param {string} category - what to search for (e.g. 'jeans', 'white shirt')
 * @param {string} searchQuery - the optimized search query from trend data
 * @param {number} limit - how many results to return
 * @returns {Promise<Array>} array of product objects
 */
async function searchProducts(category, searchQuery, limit = 3) {
  const cacheKey = `products:${searchQuery}`;
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data.slice(0, limit);
  }

  // Try SerpAPI first
  if (SERPAPI_KEY) {
    try {
      const serpResults = await searchSerpAPI(searchQuery + ' buy online', 'google_shopping');
      if (serpResults && serpResults.length > 0) {
        // Filter out results without images or prices
        const validResults = serpResults
          .filter(r => r.title && (r.image || r.price))
          .map((r, i) => ({
            id: `serp-${Date.now()}-${i}`,
            title: r.title,
            brand: r.brand || extractBrandFromTitle(r.title),
            price: r.price || 'See price',
            image: r.image || getFallbackImage(category),
            url: r.url || `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=shop`,
            retailer: r.retailer || 'Google Shopping',
          }));

        if (validResults.length >= 2) {
          productCache.set(cacheKey, { data: validResults, timestamp: Date.now() });
          return validResults.slice(0, limit);
        }
      }
    } catch (err) {
      console.error('[ShoppingSearch] SerpAPI failed, using catalogue:', err.message);
    }
  }

  // Fallback to curated catalogue
  const catalogueResults = getCatalogueProducts(category);
  productCache.set(cacheKey, { data: catalogueResults, timestamp: Date.now() });
  return catalogueResults.slice(0, limit);
}

function getCatalogueProducts(category) {
  if (!category) return PRODUCT_CATALOGUE['default'];
  const cat = category.toLowerCase().trim();

  // Exact match
  if (PRODUCT_CATALOGUE[cat]) return PRODUCT_CATALOGUE[cat];

  // Partial match
  for (const [key, products] of Object.entries(PRODUCT_CATALOGUE)) {
    if (cat.includes(key) || key.includes(cat)) return products;
  }

  // Keyword match
  const keywords = {
    'shirt': 'white shirt', 'blouse': 'white shirt', 'top': 'white shirt',
    'jean': 'jeans', 'denim': 'jeans', 'pant': 'jeans', 'trouser': 'chinos',
    'chino': 'chinos', 'khaki': 'chinos',
    'sneaker': 'sneakers', 'trainer': 'sneakers', 'shoe': 'sneakers',
    'boot': 'boots', 'heel': 'heels', 'sandal': 'sandals',
    'blazer': 'blazer', 'jacket': 'denim jacket', 'coat': 'blazer',
    'hoodie': 'hoodie', 'sweatshirt': 'hoodie', 'sweater': 'hoodie',
    'dress': 'dress', 'skirt': 'skirt', 'polo': 'polo',
  };

  for (const [keyword, catalogKey] of Object.entries(keywords)) {
    if (cat.includes(keyword)) {
      return PRODUCT_CATALOGUE[catalogKey] || PRODUCT_CATALOGUE['default'];
    }
  }

  return PRODUCT_CATALOGUE['default'];
}

function extractBrandFromTitle(title) {
  if (!title) return 'Brand';
  const knownBrands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Levi\'s', 'Gap', 'Mango', 'ASOS', 'Nordstrom', 'Everlane'];
  for (const brand of knownBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  return title.split(' ')[0];
}

function getFallbackImage(category) {
  const imageMap = {
    'jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
    'shirt': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80',
    'sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    'boots': 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&q=80',
    'blazer': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80',
    'dress': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80',
  };

  if (!category) return 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80';
  const cat = category.toLowerCase();
  for (const [key, url] of Object.entries(imageMap)) {
    if (cat.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80';
}

module.exports = { searchProducts };
