# Outfit Suggestion System - Technical Specification

## Project Overview
- **Name**: StyleAI - Outfit Suggestion System
- **Type**: Full-stack fashion-tech web application with ML integration
- **Core Functionality**: AI-powered wardrobe management and outfit recommendations with shopping integration
- **Target Users**: Fashion-conscious individuals seeking personalized outfit suggestions

## Technology Stack

### Frontend
- React 18 with TypeScript
- TailwindCSS for styling
- Zustand for state management
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- PostgreSQL with Prisma ORM
- Redis for caching
- JWT for authentication
- Express-rate-limit for rate limiting

### ML Services
- TensorFlow/Keras for image classification
- OpenCV for image processing
- Flask for ML API endpoints

### Infrastructure
- Docker and Docker Compose
- Nginx for reverse proxy

---

## UI/UX Specification

### Color Palette
- **Primary**: #1A1A2E (Deep Navy)
- **Secondary**: #16213E (Dark Blue)
- **Accent**: #E94560 (Coral Red)
- **Success**: #4ADE80 (Green)
- **Background**: #0F0F1A (Almost Black)
- **Surface**: #1F1F35 (Dark Surface)
- **Text Primary**: #FFFFFF
- **Text Secondary**: #A0A0B8
- **Border**: #2D2D4A

### Typography
- **Primary Font**: "Outfit", sans-serif (Google Fonts)
- **Secondary Font**: "DM Sans", sans-serif
- **Heading Sizes**: H1: 36px, H2: 28px, H3: 22px, H4: 18px
- **Body**: 16px, Small: 14px

### Spacing System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Components
1. **Navigation Bar**: Fixed top, blur backdrop, logo + menu + auth buttons
2. **Sidebar**: Collapsible on mobile, categories with icons
3. **Card**: Rounded corners (12px), subtle shadow, hover lift effect
4. **Button**: Primary (accent), Secondary (outlined), Ghost
5. **Input**: Dark background, border focus animation
6. **Modal**: Centered, backdrop blur, slide-up animation
7. **Toast**: Bottom-right, slide-in animation
8. **Image Upload**: Drag-drop zone, file picker, preview

---

## Page Structure

### 1. Landing Page (`/`)
- Hero section with animated gradient background
- Feature highlights (3 cards)
- CTA buttons

### 2. Onboarding (`/onboarding`)
- Multi-step form with progress indicator
- Gender selection (4 cards with icons)
- Style preferences (multi-select)
- Color preferences (color picker)

### 3. Dashboard (`/dashboard`)
- Sidebar navigation
- Stats cards (items count, outfits, favorites)
- Recent items grid
- Quick actions

### 4. Wardrobe (`/wardrobe`)
- Category tabs
- Filter sidebar (season, color, style, brand)
- Items grid (masonry layout)
- Add item floating button

### 5. Add/Edit Item (`/wardrobe/add`, `/wardrobe/edit/:id`)
- Image upload with drag-drop
- Product URL input
- Auto-fill metadata
- Category selector
- Color picker
- Tags input
- Season selector

### 6. Recommendations (`/recommendations`)
- Criteria selector (occasion, style, season)
- Generated outfits carousel
- Compatibility scores
- Explanation cards
- Save/Share actions

### 7. Outfit Detail (`/outfits/:id`)
- Outfit visualization
- Item cards
- Rating system
- Shopping suggestions

### 8. Shopping (`/shopping`)
- Item cards with prices
- Retailer comparison
- Wishlist toggle

### 9. Profile (`/profile`)
- User info
- Preferences editor
- Account settings

---

## API Specification

### Versioning
- Base URL: `/api/v1`

### Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

#### Users
- `GET /users/me` - Get profile
- `PUT /users/me` - Update profile
- `PUT /users/me/preferences` - Update preferences

#### Wardrobe
- `GET /wardrobe` - List items (with filters)
- `POST /wardrobe` - Add item
- `GET /wardrobe/:id` - Get item
- `PUT /wardrobe/:id` - Update item
- `DELETE /wardrobe/:id` - Delete item
- `POST /wardrobe/:id/favorite` - Toggle favorite

#### Recommendations
- `POST /recommendations/generate` - Generate outfits
- `GET /recommendations/history` - Get suggestion history

#### Outfits
- `GET /outfits` - List saved outfits
- `POST /outfits` - Save outfit
- `GET /outfits/:id` - Get outfit
- `DELETE /outfits/:id` - Delete outfit
- `POST /outfits/:id/rate` - Rate outfit

#### Shopping
- `GET /shopping/search` - Search products
- `POST /shopping/wishlist` - Add to wishlist
- `GET /shopping/wishlist` - Get wishlist
- `DELETE /shopping/wishlist/:id` - Remove from wishlist

#### ML
- `POST /ml/classify` - Classify clothing image
- `POST /ml/extract-colors` - Extract colors from image
- `POST /ml/compatibility` - Calculate outfit compatibility
- `POST /ml/scrape` - Scrape product metadata

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  gender VARCHAR(20),
  style_preferences JSONB DEFAULT '[]',
  color_preferences JSONB DEFAULT '[]',
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Wardrobe Items Table
```sql
CREATE TABLE wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  product_url VARCHAR(500),
  brand VARCHAR(100),
  name VARCHAR(200),
  colors JSONB DEFAULT '[]',
  dominant_color VARCHAR(20),
  season VARCHAR(20)[],
  tags TEXT[],
  style_tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Outfits Table
```sql
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  occasion VARCHAR(50),
  style_type VARCHAR(50),
  season VARCHAR(20),
  rating INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Suggestions Table
```sql
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  suggested_items JSONB NOT NULL,
  compatibility_score FLOAT,
  reason TEXT,
  occasion VARCHAR(50),
  style_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Wishlist Table
```sql
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_url VARCHAR(500) NOT NULL,
  product_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ML Model Architecture

### 1. Classification Model
- **Input**: 224x224 RGB image
- **Base**: EfficientNetB0 (transfer learning)
- **Output**: Category probabilities (15 classes)
- **Classes**: shirt, t-shirt, dress, pants, shorts, skirt, jacket, coat, sweater, hoodie, shoes, sneakers, boots, accessories, outerwear

### 2. Color Extraction
- **Method**: K-means clustering (k=5)
- **Output**: Top 5 colors with percentages
- **Format**: HEX codes

### 3. Compatibility Model
- **Architecture**: Siamese network
- **Input**: Two item embeddings (512-d)
- **Output**: Similarity score (0-1)

### 4. Feature Extraction
- Color histogram (HSV)
- Texture features (LBP)
- Style embeddings

---

## Acceptance Criteria

### Functional
- [ ] User can register and login
- [ ] User can add wardrobe items with images
- [ ] User can categorize and tag items
- [ ] User can generate outfit recommendations
- [ ] User can save and rate outfits
- [ ] User can browse shopping suggestions

### Visual
- [ ] Responsive design works on all breakpoints
- [ ] Animations are smooth (60fps)
- [ ] Loading states are shown
- [ ] Error states are handled gracefully
- [ ] Dark theme is consistent throughout

### Performance
- [ ] API response time < 500ms
- [ ] Image upload < 5s for 5MB file
- [ ] Recommendation generation < 3s

### Security
- [ ] JWT tokens expire correctly
- [ ] Passwords are hashed
- [ ] SQL injection is prevented
- [ ] Rate limiting is applied