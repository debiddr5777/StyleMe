/**
 * Product Analyzer Service
 * 
 * Strategy for blocked sites:
 * 1. Try direct scraping (works for simpler sites)
 * 2. If blocked, extract product info from the URL itself (hostname + path keywords)
 * 3. Use SerpAPI to search for the product and get real metadata from Google's cache
 * 
 * This ensures we ALWAYS return something useful regardless of site scraping protection.
 */

const axios = require('axios');
const cheerio = require('cheerio');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const SERPAPI_KEY = process.env.SERPAPI_KEY;

// ── Category Classification from Title ──────────────────────────────────────
function classifyFromTitle(title = '', description = '') {
  const text = (title + ' ' + description).toLowerCase();

  const categoryKeywords = [
    { category: 'dress', keywords: ['dress', 'gown', 'frock', 'maxi', 'midi dress', 'mini dress'] },
    { category: 'shirt', keywords: ['shirt', 'button down', 'button-down', 'oxford', 'blouse', 'tunic', 'linen shirt', 'flannel'] },
    { category: 't-shirts', keywords: ['t-shirt', 'tshirt', 'tee', 'graphic tee', 'crew neck', 'v-neck', 'tank top', 'crop top', 'halter'] },
    { category: 'sweater', keywords: ['sweater', 'knitwear', 'knit', 'pullover', 'jumper', 'cardigan', 'turtleneck', 'crewneck'] },
    { category: 'hoodie', keywords: ['hoodie', 'sweatshirt', 'fleece', 'zip-up'] },
    { category: 'jeans', keywords: ['jeans', 'denim', 'jean', 'skinny jeans', 'straight jeans', 'wide leg', 'slim fit jeans', 'bootcut'] },
    { category: 'chinos', keywords: ['chino', 'chinos', 'khaki', 'trousers', 'slacks', 'dress pants', 'dress trousers'] },
    { category: 'shorts', keywords: ['shorts', 'bermuda', 'cutoffs', 'athletic shorts'] },
    { category: 'skirt', keywords: ['skirt', 'midi skirt', 'mini skirt', 'maxi skirt', 'pleated skirt', 'a-line skirt'] },
    { category: 'jacket|denim', keywords: ['denim jacket', 'jean jacket', 'trucker jacket'] },
    { category: 'jacket|leather', keywords: ['leather jacket', 'moto jacket', 'biker jacket', 'faux leather jacket'] },
    { category: 'blazer', keywords: ['blazer', 'suit jacket', 'sport coat'] },
    { category: 'coat', keywords: ['coat', 'overcoat', 'trench coat', 'puffer', 'parka', 'windbreaker'] },
    { category: 'sneakers', keywords: ['sneakers', 'trainers', 'running shoes', 'tennis shoes', 'athletic shoes', 'court shoes', 'canvas shoes'] },
    { category: 'boots', keywords: ['boots', 'ankle boots', 'chelsea boots', 'combat boots', 'knee-high boots', 'booties'] },
    { category: 'heels', keywords: ['heels', 'pumps', 'stilettos', 'wedges', 'platform shoes'] },
    { category: 'sandals', keywords: ['sandals', 'flip flops', 'slides', 'mules', 'strappy sandals'] },
    { category: 'loafers', keywords: ['loafers', 'penny loafer', 'slip-on', 'moccasins'] },
    { category: 'accessories', keywords: ['bag', 'handbag', 'tote', 'clutch', 'purse', 'backpack', 'belt', 'scarf', 'hat', 'cap', 'sunglasses', 'jewelry', 'watch', 'necklace', 'earrings', 'bracelet'] },
    { category: 'polo', keywords: ['polo', 'polo shirt'] },
  ];

  for (const { category, keywords } of categoryKeywords) {
    if (keywords.some(kw => text.includes(kw))) return category;
  }
  return 'clothing';
}

// ── Color Extraction from Title ──────────────────────────────────────────────
function extractColorFromTitle(title = '') {
  const text = title.toLowerCase();
  const colorKeywords = [
    { name: 'white', hex: '#F5F5F5' }, { name: 'black', hex: '#1A1A1A' },
    { name: 'navy', hex: '#1E3A5F' }, { name: 'blue', hex: '#2563EB' },
    { name: 'red', hex: '#DC2626' }, { name: 'green', hex: '#16A34A' },
    { name: 'beige', hex: '#D4B483' }, { name: 'camel', hex: '#C19A6B' },
    { name: 'grey', hex: '#9CA3AF' }, { name: 'gray', hex: '#9CA3AF' },
    { name: 'brown', hex: '#92400E' }, { name: 'cream', hex: '#FEFCE8' },
    { name: 'ivory', hex: '#FDFBF7' }, { name: 'khaki', hex: '#C3B091' },
    { name: 'olive', hex: '#6B7C45' }, { name: 'rust', hex: '#B7410E' },
    { name: 'burgundy', hex: '#800020' }, { name: 'pink', hex: '#F9A8D4' },
    { name: 'purple', hex: '#7C3AED' }, { name: 'yellow', hex: '#FBBF24' },
    { name: 'orange', hex: '#F97316' }, { name: 'teal', hex: '#0D9488' },
    { name: 'denim', hex: '#4B6FA5' }, { name: 'indigo', hex: '#4338CA' },
    { name: 'lavender', hex: '#C4B5FD' }, { name: 'mint', hex: '#6EE7B7' },
    { name: 'coral', hex: '#F87171' }, { name: 'tan', hex: '#D2B48C' },
    { name: 'light blue', hex: '#93C5FD' }, { name: 'dark blue', hex: '#1E3A8A' },
    { name: 'forest green', hex: '#166534' },
  ];
  // Try multi-word first, then single-word
  const multiWord = colorKeywords.filter(c => c.name.includes(' '));
  const singleWord = colorKeywords.filter(c => !c.name.includes(' '));

  for (const { name, hex } of [...multiWord, ...singleWord]) {
    if (text.includes(name)) return { name, hex };
  }
  return null;
}

// ── Brand from URL ────────────────────────────────────────────────────────────
function extractBrandFromURL(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const brandMap = {
      'zara.com': 'Zara',
      'hm.com': 'H&M',
      'uniqlo.com': 'Uniqlo',
      'levi.com': "Levi's", 'levis.com': "Levi's",
      'nike.com': 'Nike', 'adidas.com': 'Adidas', 'puma.com': 'Puma',
      'mango.com': 'Mango', 'asos.com': 'ASOS', 'gap.com': 'Gap',
      'amazon.com': 'Amazon', 'amazon.in': 'Amazon',
      'flipkart.com': 'Flipkart', 'myntra.com': 'Myntra',
      'ajio.com': 'Ajio', 'nykaa.com': 'Nykaa', 'nykfashion.com': 'Nykaa',
      'nordstrom.com': 'Nordstrom', 'macys.com': "Macy's",
      'forever21.com': 'Forever 21', 'shein.com': 'SHEIN',
      'ralphlauren.com': 'Ralph Lauren', 'calvinklein.com': 'Calvin Klein',
      'urbanoutfitters.com': 'Urban Outfitters', 'freepeople.com': 'Free People',
      'anthropologie.com': 'Anthropologie', 'aritzia.com': 'Aritzia',
      'revolve.com': 'Revolve', 'fashionnova.com': 'Fashion Nova',
      'boohoo.com': 'Boohoo', 'prettylittlething.com': 'PLT',
      'topshop.com': 'Topshop', 'newlook.com': 'New Look',
      'target.com': 'Target', 'walmart.com': 'Walmart',
      'abercrombie.com': 'Abercrombie', 'hollister.com': 'Hollister',
    };
    // Match longest domain suffix first
    for (const [domain, brand] of Object.entries(brandMap)) {
      if (hostname.includes(domain)) return brand;
    }
    const clean = hostname.replace(/^(www\d*|m)\./, '');
    const parts = clean.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return '';
  }
}

// ── Extract keywords from URL path ───────────────────────────────────────────
function extractKeywordsFromURL(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    // Remove IDs (numbers) and common path words
    const keywords = path
      .split(/[/\-_.]/)
      .filter(w => w.length > 3 && !/^\d+$/.test(w) && !['html', 'com', 'www', 'product', 'productpage', 'products', 'item', 'catalog', 'shop'].includes(w))
      .slice(0, 5)
      .join(' ');
    return keywords;
  } catch {
    return '';
  }
}

// ── SerpAPI product lookup ────────────────────────────────────────────────────
async function lookupProductViaSerpAPI(url) {
  if (!SERPAPI_KEY) return null;

  try {
    const brand = extractBrandFromURL(url);
    const urlKeywords = extractKeywordsFromURL(url);
    const searchQuery = brand && urlKeywords
      ? `${brand} ${urlKeywords} clothing`
      : `site:${new URL(url).hostname} clothing`;

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: SERPAPI_KEY,
        q: searchQuery,
        engine: 'google',
        num: 5,
        gl: 'us',
        hl: 'en',
      },
      timeout: 10000,
    });

    const results = response.data.organic_results || [];
    if (results.length === 0) return null;

    const topResult = results[0];
    // Try to get image from knowledge_graph or inline_images
    const image = response.data.knowledge_graph?.image ||
      response.data.inline_images?.[0]?.original ||
      '';

    return {
      title: topResult.title || '',
      snippet: topResult.snippet || '',
      image,
      source: topResult.displayed_link || brand,
    };
  } catch (err) {
    console.error('[ProductAnalyzer] SerpAPI lookup failed:', err.message);
    return null;
  }
}

// ── Direct Scraper ────────────────────────────────────────────────────────────
async function scrapeProductPage(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Referer': 'https://www.google.com/',
    },
    timeout: 12000,
    maxRedirects: 5,
  });

  const $ = cheerio.load(response.data);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('[itemprop="name"]').first().text() ||
    $('h1[class*="title"], h1[class*="name"], h1[class*="product"]').first().text() ||
    $('h1').first().text() ||
    $('title').text().split('|')[0].split(' - ')[0] ||
    '';

  const price =
    $('meta[property="og:price:amount"]').attr('content') ||
    $('[itemprop="price"]').attr('content') ||
    $('[itemprop="price"]').first().text() ||
    $('[class*="price"]:not([class*="original"]):not([class*="old"]):not([class*="strike"])').first().text() ||
    $('[class*="Price"]:not([class*="Original"]):not([class*="Old"])').first().text() ||
    '';

  let image =
    $('meta[property="og:image"]').attr('content') ||
    $('[itemprop="image"]').attr('content') ||
    $('[itemprop="image"]').attr('src') ||
    $('img[class*="product"][class*="image"], img[class*="main"], img[class*="hero"]').first().attr('src') ||
    '';

  const brand =
    $('meta[property="og:site_name"]').attr('content') ||
    $('[itemprop="brand"]').first().text() ||
    extractBrandFromURL(url) ||
    '';

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  // Fix relative image URLs
  if (image && image.startsWith('//')) image = 'https:' + image;
  else if (image && image.startsWith('/')) {
    try { image = new URL(url).origin + image; } catch {}
  }

  return {
    title: title.trim().replace(/\s+/g, ' ').slice(0, 200),
    price: price.toString().trim() || null,
    image: image.trim(),
    brand: brand.trim().slice(0, 100),
    description: description.trim().slice(0, 500),
    url,
  };
}

// ── Main Export: analyzeProduct ───────────────────────────────────────────────
/**
 * Full product analysis: scrape + classify + colors
 * Falls back gracefully if scraping is blocked.
 * @param {string} url - product page URL
 * @returns {Promise<object>} structured product data
 */
async function analyzeProduct(url) {
  const brand = extractBrandFromURL(url);
  const urlKeywords = extractKeywordsFromURL(url);

  let scraped = null;
  let scrapingFailed = false;

  // 1. Try direct scraping
  try {
    scraped = await scrapeProductPage(url);
    // Check if we got meaningful data (sites may return a page but with no OG tags)
    if (!scraped.title && !scraped.image) {
      scrapingFailed = true;
    }
  } catch (err) {
    console.log('[ProductAnalyzer] Direct scrape blocked, using fallback:', err.message.slice(0, 80));
    scrapingFailed = true;
  }

  // 2. If scraping failed/insufficient, try SerpAPI
  if (scrapingFailed && SERPAPI_KEY) {
    try {
      const serpData = await lookupProductViaSerpAPI(url);
      if (serpData) {
        scraped = {
          title: serpData.title || `${brand} ${urlKeywords}`,
          price: null,
          image: serpData.image || '',
          brand,
          description: serpData.snippet || '',
          url,
        };
        scrapingFailed = false;
      }
    } catch (err) {
      console.log('[ProductAnalyzer] SerpAPI fallback also failed:', err.message);
    }
  }

  // 3. If everything failed, construct from URL data alone (always works)
  if (scrapingFailed || !scraped) {
    scraped = {
      title: `${brand} ${urlKeywords}`.trim() || 'Fashion Item',
      price: null,
      image: '',
      brand,
      description: urlKeywords,
      url,
    };
  }

  // 4. Classify category
  const fullText = `${scraped.title} ${scraped.description} ${urlKeywords}`;
  const category = classifyFromTitle(fullText, '');

  // 5. Extract color
  const titleColor = extractColorFromTitle(fullText);

  // 6. Try ML service image colors (optional)
  let colors = null;
  let dominantColor = titleColor?.hex || '#1A1A2E';

  if (scraped.image) {
    try {
      const mlResp = await axios.post(
        `${ML_SERVICE_URL}/extract-colors`,
        { imageUrl: scraped.image },
        { timeout: 5000 }
      );
      if (mlResp.data?.colors?.length > 0) {
        colors = mlResp.data.colors;
        dominantColor = mlResp.data.dominantColor || dominantColor;
      }
    } catch {
      // ML service unavailable
    }
  }

  if (!colors) {
    colors = titleColor
      ? [{ hex: titleColor.hex, name: titleColor.name, percentage: 60 }]
      : [{ hex: '#1A1A2E', name: 'Navy', percentage: 60 }];
  }

  return {
    title: scraped.title,
    price: scraped.price,
    image: scraped.image,
    brand: scraped.brand || brand,
    url: scraped.url,
    category,
    colors,
    dominantColor,
  };
}

module.exports = { analyzeProduct, classifyFromTitle, extractColorFromTitle, scrapeProductPage, extractBrandFromURL, extractKeywordsFromURL };
