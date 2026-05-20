# StyleAI - Outfit Suggestion System

A comprehensive, production-ready outfit suggestion system with AI-powered recommendations.

## Features

- **Wardrobe Management**: Catalog clothes with AI categorization
- **Smart Recommendations**: Generate outfits based on occasion, style, and weather
- **Color Analysis**: Automatic color extraction from images
- **Shopping Integration**: Browse and wishlist products
- **Profile Management**: Personalized preferences

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS + Zustand
- **Backend**: Node.js + Express + Prisma
- **Database**: SQLite (no Docker needed)
- **ML**: Python + Flask

## Quick Start (No Docker)

### Prerequisites
- Node.js 20+

### Run

```bash
# Double-click start.bat OR run in terminal:
cd C:\PERSONAL\server
npm install
node src/index.js

# In another terminal:
cd C:\PERSONAL\client
npm install
npm run dev
```

Then open http://localhost:5173

## Project Structure

```
/
├── server/           # Express backend (port 3001)
│   ├── src/
│   │   ├── routes/ # API routes
│   │   └── config/
│   └── prisma/    # SQLite database
├── client/        # React frontend (port 5173)
│   └── src/
│       ├── pages/ # 11 pages
│       └── components/
├── ml-service/   # ML API (port 5001)
├── start.bat     # Quick start script
└── SPEC.md      # Full specification
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| POST /api/v1/auth/register | Register new user |
| POST /api/v1/auth/login | Login |
| GET /api/v1/wardrobe | List wardrobe items |
| POST /api/v1/wardrobe | Add item |
| POST /api/v1/recommendations/generate | Generate outfits |
| GET /api/v1/outfits | Saved outfits |
| GET /api/v1/shopping/search | Search products |

## Database

SQLite file at `server/prisma/dev.db`. Auto-created on first run.

## Troubleshooting

**Port already in use:**
```bash
# Kill existing processes
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

**Database error:**
```bash
cd server
npx prisma migrate dev --name init
```

## License

MIT