# AI Fitness Tracker

Full-stack fitness tracking application with a modern React frontend and an Express + MongoDB backend.

## What This Project Includes

- User authentication (email/password, optional Google OAuth)
- Workout tracking and workout plans
- Diet and meal tracking
- Water intake tracking
- Progress tracking with charts and photos
- Body analysis and fitness calculators
- AI-assisted workout and meal suggestions with fallback behavior

## Tech Stack

### Frontend

- React 19
- Vite
- Bootstrap 5
- React Router
- Framer Motion
- Recharts
- react-hot-toast

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT auth
- Passport Google OAuth 2.0
- CORS + session support

## Project Structure

```text
fitness-tracker-frontend/
  backend/                # Express API
  src/                    # React app
  public/
  package.json            # Frontend scripts
  README.md
```

## Prerequisites

- Node.js 18+ (recommended 20+)
- npm
- MongoDB (local or cloud)

## Quick Start

### 1. Install dependencies

From project root:

```bash
npm install
```

Backend dependencies:

```bash
cd backend
npm install
```

### 2. Configure environment

Copy backend example env:

```bash
cd backend
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then update backend/.env values.

Required variables for local run:

- PORT (default 5000)
- MONGO_URI
- JWT_SECRET
- SESSION_SECRET
- CORS_ORIGINS (for local frontend usually http://localhost:5173)
- FRONTEND_URL (for OAuth callback redirects)

Optional:

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GROQ_API_KEY (for backend AI route)

### 3. Run backend

```bash
cd backend
npm run dev
```

### 4. Run frontend

In a second terminal:

```bash
npm run dev
```

### 5. Open app

- Frontend: http://localhost:5173
- Backend health check: http://localhost:5000/api/health

## Frontend Environment (Optional)

The frontend can run without extra env values using defaults/fallbacks.

Optional frontend .env entries:

- VITE_API_URL (defaults to http://localhost:5000/api)
- VITE_GROQ_API_KEY (if you want direct frontend AI calls)

## Scripts

### Frontend (root)

- npm run dev: start Vite dev server
- npm run build: production build
- npm run preview: preview production build
- npm run lint: run ESLint

### Backend (backend folder)

- npm run dev: start API with nodemon
- npm start: start API
- npm run seed:lkman: seed user history sample

Note: backend predev/prestart includes a port cleanup script for port 5000.

## Authentication Notes

- Email/password auth works with backend JWT.
- Google OAuth requires valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET plus configured callback URLs.
- See backend/GOOGLE_AUTH_SETUP.md for Google OAuth setup details.

## AI Notes

- AI utility supports fallback mode when key is missing.
- Backend route /api/ai expects GROQ_API_KEY to be configured for live responses.
- Frontend utility also supports fallback when VITE_GROQ_API_KEY is not present.

## Security Notes

- Never commit real .env files.
- Keep secrets only in local env or secure deployment config.
- The repository includes example env templates only.

## Build and Validation

From root:

```bash
npm run lint
npm run build
```

## Deploy Frontend on Vercel

- Import this repository in Vercel.
- Framework preset: Vite.
- Root directory: . (this repository root).
- Install command: npm install.
- Build command: npm run build.
- Output directory: dist.
- Add environment variable VITE_API_URL with your deployed backend API URL, for example https://your-backend-domain.com/api.
- Add VITE_GROQ_API_KEY only if you want direct frontend AI calls.
- Redeploy after updating environment variables.

This project includes vercel.json with SPA rewrite support so React Router routes work on refresh.

## Additional Docs

- docs/COMPLETE_README.md
- docs/INTEGRATION_GUIDE.md
- docs/PROJECT_DOCUMENTATION.md
- docs/Groupname_ICT3230_Backend_Report.md
- backend/GOOGLE_AUTH_SETUP.md

## Troubleshooting

### Backend not starting

- Ensure MongoDB is running and MONGO_URI is valid.
- Confirm PORT is free (port cleanup script should help automatically).

### CORS errors

- Set CORS_ORIGINS in backend/.env to include your frontend origin.

### OAuth redirect issues

- Verify FRONTEND_URL and Google console redirect URIs match exactly.

### API calls failing from frontend

- Confirm backend is running on expected URL.
- If needed, set VITE_API_URL in frontend env.
