/**
 * Vision Analyzer Service
 * Uses OpenRouter's free Gemini 2.0 Flash vision model to analyze clothing images.
 * This gives us actual visual understanding of products — category, colors, style,
 * fit, and occasion — rather than guessing from title keywords alone.
 */

const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// Free vision models on OpenRouter (in priority order)
const VISION_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'google/gemini-flash-1.5-8b:free',
];

// ── Cache to avoid re-analyzing the same image ───────────────────────────────
const visionCache = new Map();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Analyze a clothing image using OpenRouter vision model.
 * @param {string} imageUrl - URL of the product image
 * @param {string} productTitle - Optional product title for context
 * @returns {Promise<object|null>} structured vision analysis
 */
async function analyzeImageWithVision(imageUrl, productTitle = '') {
  if (!OPENROUTER_API_KEY) {
    console.log('[Vision] No OpenRouter key, skipping vision analysis');
    return null;
  }

  if (!imageUrl || !imageUrl.startsWith('http')) {
    return null;
  }

  const cacheKey = imageUrl;
  const cached = visionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[Vision] Cache hit for:', imageUrl.slice(0, 60));
    return cached.data;
  }

  const prompt = `You are a professional fashion stylist analyzing a clothing product image.
${productTitle ? `Product title: "${productTitle}"` : ''}

Analyze the clothing item in this image and return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:

{
  "category": "one of: t-shirts, shirt, dress, jeans, chinos, shorts, skirt, blazer, jacket|denim, jacket|leather, coat, sneakers, boots, heels, sandals, loafers, hoodie, sweater, polo, accessories, clothing",
  "dominantColor": "hex color code of the main color (e.g. #FFFFFF)",
  "colors": [
    {"name": "color name", "hex": "#hexcode", "percentage": 60}
  ],
  "colorNames": ["white", "black"],
  "styleDescription": "2-sentence description of the item's style",
  "occasion": "one of: casual, work, formal, party, date, workout, versatile",
  "fit": "one of: slim, regular, relaxed, oversized",
  "material": "detected material if visible (e.g. denim, cotton, silk, leather)",
  "gender": "one of: male, female, unisex",
  "pairsWellWith": ["2-4 specific items this pairs with, e.g. 'slim black chinos', 'white sneakers'"]
}

Be precise with colors. Return ONLY the JSON.`;

  let lastError = null;

  for (const model of VISION_MODELS) {
    try {
      console.log(`[Vision] Trying model: ${model}`);

      const response = await axios.post(
        `${OPENROUTER_BASE}/chat/completions`,
        {
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: imageUrl },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 600,
          temperature: 0.1,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'StyleMe Fashion App',
          },
          timeout: 20000,
        }
      );

      const content = response.data.choices?.[0]?.message?.content || '';
      console.log(`[Vision] Raw response from ${model}:`, content.slice(0, 200));

      // Parse the JSON from response
      const parsed = extractJSON(content);
      if (parsed && parsed.category) {
        console.log('[Vision] Successfully analyzed image:', {
          category: parsed.category,
          dominantColor: parsed.dominantColor,
          occasion: parsed.occasion,
        });

        const result = {
          category: parsed.category || 'clothing',
          dominantColor: parsed.dominantColor || '#1A1A2E',
          colors: parsed.colors || (parsed.dominantColor
            ? [{ hex: parsed.dominantColor, name: parsed.colorNames?.[0] || 'Unknown', percentage: 60 }]
            : [{ hex: '#1A1A2E', name: 'Navy', percentage: 60 }]),
          colorNames: parsed.colorNames || [],
          styleDescription: parsed.styleDescription || '',
          occasion: parsed.occasion || 'casual',
          fit: parsed.fit || 'regular',
          material: parsed.material || '',
          gender: parsed.gender || 'unisex',
          pairsWellWith: parsed.pairsWellWith || [],
          model,
        };

        visionCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      console.error(`[Vision] ${model} failed (${status}):`, msg.slice(0, 100));

      // If rate limited or auth error, don't try next model for auth issues
      if (status === 401 || status === 403) {
        console.error('[Vision] Auth error — check OPENROUTER_API_KEY');
        break;
      }
      // For rate limits or model issues, try next
      continue;
    }
  }

  console.error('[Vision] All vision models failed. Last error:', lastError?.message);
  return null;
}

// ── JSON extractor from model response ───────────────────────────────────────
function extractJSON(text) {
  if (!text) return null;

  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch {}

  // Extract JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }

  // Extract first {...} block
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }

  return null;
}

/**
 * Quick check if OpenRouter is configured and available
 */
async function isVisionAvailable() {
  return !!(OPENROUTER_API_KEY);
}

module.exports = { analyzeImageWithVision, isVisionAvailable };
