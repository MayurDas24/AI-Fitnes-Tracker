# 🏋️ AI FITNESS TRACKER — Complete Project Documentation

> **Everything you need to know about this project in one place.**
> Written for presentation purposes — even if you haven't contributed, you'll fully understand the project after reading this.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture Diagram](#4-architecture-diagram)
5. [Backend — In Detail](#5-backend--in-detail)
6. [Frontend — In Detail](#6-frontend--in-detail)
7. [Features Breakdown](#7-features-breakdown)
8. [Authentication System](#8-authentication-system)
9. [AI Integration](#9-ai-integration)
10. [Database Schema](#10-database-schema)
11. [API Endpoints](#11-api-endpoints)
12. [Design System & UI](#12-design-system--ui)
13. [How to Run the Project](#13-how-to-run-the-project)
14. [Environment Variables](#14-environment-variables)
15. [Key Libraries Used](#15-key-libraries-used)

---

## 1. Project Overview

**AI Fitness Tracker** is a full-stack web application that helps users track their fitness journey. It covers workouts, diet, water intake, body measurements, progress tracking, and provides AI-powered features like workout plan generation, meal suggestions, and an AI chatbot assistant.

**What makes it special:**
- AI-powered workout plan generation and diet suggestions using Groq API (LLaMA 3.3 70B model)
- Secure authentication with Email/Password, Google OAuth, and Two-Factor Authentication (2FA)
- Real-time dashboard with live charts, stats, and motivational quotes
- Industrial "FORGE" design system — a dark, high-energy gym aesthetic
- All data is stored in MongoDB and synced between frontend and backend
- PDF export support for workout plans and progress reports

---

## 2. Tech Stack

This is a **MERN + Bootstrap** project:

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **M** — Database | MongoDB + Mongoose | v8.0 | NoSQL database for storing all user data |
| **E** — Backend Framework | Express.js | v4.18 | REST API server handling all routes |
| **R** — Frontend Framework | React | v19.2 | UI library for building the interface |
| **N** — Runtime | Node.js | Latest | JavaScript runtime for the backend |
| **Build Tool** | Vite | v7.3 | Fast development server and build tool |
| **CSS Framework** | Bootstrap 5 + TailwindCSS | v5.3 / v3.4 | UI styling (Bootstrap for layout, Tailwind for utility classes) |
| **Animations** | Framer Motion | v12.34 | Smooth page transitions and micro-animations |
| **Charts** | Recharts | v3.7 | Data visualization (calorie charts, weight trends) |
| **Icons** | Lucide React | v0.575 | Modern icon library used across all pages |
| **AI Engine** | Groq API (LLaMA 3.3 70B) | — | Powers workout generation, diet suggestions, and AI chatbot |
| **Auth** | JWT + Passport.js + Speakeasy | — | Token-based auth, Google OAuth, and TOTP-based 2FA |

---

## 3. Project Structure

```
fitness-tracker-frontend/
│
├── 📁 backend/                    ← NODE.JS + EXPRESS BACKEND
│   ├── 📁 config/
│   │   └── passport.js            ← Google OAuth strategy config
│   ├── 📁 models/                 ← MONGOOSE SCHEMAS (8 models)
│   │   ├── User.js                ← User accounts + profile data + 2FA
│   │   ├── Workout.js             ← Workout sessions (exercises, sets, volume, calories)
│   │   ├── Meal.js                ← Meal entries (calories, protein, carbs, fat)
│   │   ├── Progress.js            ← Body progress logs (weight, body fat, measurements)
│   │   ├── Water.js               ← Daily water intake tracking
│   │   ├── Favorite.js            ← Favorite exercises saved by users
│   │   ├── BodyAnalysis.js        ← Body analysis results (focus areas, training plan)
│   │   └── Calculation.js         ← Saved calculator results (BMI, BMR, TDEE, etc.)
│   ├── 📁 routes/                 ← API ROUTE HANDLERS (9 route files)
│   │   ├── auth.js                ← Signup, Login, Google OAuth, 2FA, Profile
│   │   ├── workouts.js            ← CRUD for workout sessions
│   │   ├── meals.js               ← CRUD for meal entries
│   │   ├── progress.js            ← CRUD for progress logs
│   │   ├── water.js               ← CRUD for water intake
│   │   ├── favorites.js           ← Add/remove favorite exercises
│   │   ├── bodyAnalysis.js        ← CRUD for body analysis
│   │   ├── calculations.js        ← Save/retrieve calculator results
│   │   └── ai.js                  ← AI chatbot proxy to Groq API
│   ├── 📁 scripts/                ← UTILITY SCRIPTS
│   │   ├── free-port.js           ← Frees port 5000 before starting server
│   │   ├── seed-rich-demo-data.js ← Seeds demo data for testing
│   │   ├── seed-user-history.js   ← Seeds user workout/progress history
│   │   ├── seed-water-history.js  ← Seeds water intake history
│   │   ├── seed-workout-streak.js ← Seeds workout streak data
│   │   └── smoke-test.ps1        ← PowerShell smoke test script
│   ├── .env                       ← Backend environment variables (SECRETS!)
│   ├── .env.example               ← Template for .env (safe to share)
│   ├── package.json               ← Backend dependencies
│   └── server.js                  ← 🚀 MAIN BACKEND ENTRY POINT
│
├── 📁 src/                        ← REACT FRONTEND SOURCE
│   ├── 📁 components/             ← REUSABLE UI COMPONENTS
│   │   ├── EmptyState.jsx         ← Empty state placeholder (shown when no data)
│   │   └── LoadingSkeleton.jsx    ← Loading skeleton animations for all pages
│   ├── 📁 context/                ← REACT CONTEXT (Global State)
│   │   └── ThemeContext.jsx       ← Dark/Light theme toggle (persisted in localStorage)
│   ├── 📁 data/                   ← STATIC DATA
│   │   ├── exerciseLibraryData.js ← Complete exercise database (100+ exercises)
│   │   └── exercises.js           ← Exercise definitions for workout tracker
│   ├── 📁 hooks/                  ← CUSTOM REACT HOOKS
│   │   └── useApi.js              ← Reusable API fetching hook (useApi, apiGet, apiPost, apiDelete)
│   ├── 📁 pages/                  ← PAGE COMPONENTS (16 pages)
│   │   ├── LandingPage.jsx        ← Public homepage with hero section & feature cards
│   │   ├── LoginPage.jsx          ← Login/Signup with warp speed animation
│   │   ├── AuthCallback.jsx       ← Handles Google OAuth redirect callback
│   │   ├── Dashboard.jsx          ← Main dashboard (charts, stats, quick links, quotes)
│   │   ├── WorkoutTracker.jsx     ← Log workouts (exercises, sets, reps, volume)
│   │   ├── DietTracker.jsx        ← Track daily meals (calories, macros)
│   │   ├── WaterTracker.jsx       ← Track daily water intake with visual bottle
│   │   ├── ProgressPage.jsx       ← View progress charts, achievements, export PDF
│   │   ├── ExerciseLibrary.jsx    ← Browse 100+ exercises with filtering & favorites
│   │   ├── CalculatorPage.jsx     ← BMI, BMR, TDEE, macro, body fat calculators
│   │   ├── ProfilePage.jsx        ← User profile, settings, 2FA, password change
│   │   ├── WorkoutPlanGenerator.jsx ← AI-generated workout plans
│   │   ├── BodyAnalysis.jsx       ← AI-powered body composition analysis
│   │   ├── AIAssistant.jsx        ← Chat with AI fitness coach
│   │   ├── RestTimer.jsx          ← Configurable rest timer for workouts
│   │   └── NotFoundPage.jsx       ← 404 error page
│   ├── 📁 services/               ← API SERVICE LAYER
│   │   └── api.js                 ← All API functions (auth, workouts, meals, etc.)
│   ├── 📁 utils/                  ← UTILITY FUNCTIONS
│   │   ├── Calculations.js        ← BMI, BMR, TDEE, macros, body fat formulas
│   │   ├── ai.js                  ← Groq AI integration + fallback workout/meal data
│   │   ├── confetti.js            ← Celebration confetti particle effects
│   │   └── exportPDF.js           ← PDF export for workout plans & progress reports
│   ├── App.jsx                    ← Root component: routing, error boundary, auth guard
│   ├── main.jsx                   ← Entry point: React DOM render + Bootstrap import
│   └── index.css                  ← Global styles
│
├── .env                           ← Frontend environment variables
├── index.html                     ← HTML entry point
├── vite.config.js                 ← Vite configuration
├── package.json                   ← Frontend dependencies
├── tailwind.config.js             ← Tailwind CSS configuration
└── postcss.config.js              ← PostCSS configuration
```

---

## 4. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                       │
│                    http://localhost:5173                         │
│                                                                 │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌─────────────────┐  │
│  │  Pages  │  │Components│  │ Context │  │  Services/Hooks  │  │
│  │ (16)    │  │  (2)     │  │ (Theme) │  │ (api.js/useApi)  │  │
│  └────┬────┘  └──────────┘  └─────────┘  └────────┬────────┘  │
│       │                                            │            │
│       └────────────────────────────────────────────┘            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP Requests (fetch)
                           │ Authorization: Bearer <JWT>
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express + Node.js)                    │
│                    http://localhost:5000                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      server.js                            │  │
│  │  • CORS setup     • Session middleware                    │  │
│  │  • JSON parsing   • Passport initialization               │  │
│  │  • Error handler  • Route mounting                        │  │
│  └───────────────┬───────────────────────────────────────────┘  │
│                  │                                               │
│  ┌───────────────▼───────────────────────────────────────────┐  │
│  │                      Routes (9)                           │  │
│  │  /api/auth      → signup, login, Google OAuth, 2FA        │  │
│  │  /api/workouts  → CRUD workout sessions                   │  │
│  │  /api/meals     → CRUD meal entries                       │  │
│  │  /api/progress  → CRUD progress logs                      │  │
│  │  /api/water     → CRUD water intake                       │  │
│  │  /api/favorites → Add/remove favorites                    │  │
│  │  /api/body-analysis → CRUD body analyses                  │  │
│  │  /api/calculations  → Save/retrieve calculations          │  │
│  │  /api/ai        → Proxy to Groq AI API                    │  │
│  └───────────────┬───────────────────────────────────────────┘  │
│                  │                                               │
│  ┌───────────────▼───────────────────────────────────────────┐  │
│  │                    Models (Mongoose)                       │  │
│  │  User, Workout, Meal, Progress, Water,                    │  │
│  │  Favorite, BodyAnalysis, Calculation                       │  │
│  └───────────────┬───────────────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────┐     ┌─────────────────────────────┐
│        MongoDB Atlas        │     │       Groq Cloud API        │
│   (or local MongoDB)       │     │   LLaMA 3.3 70B Versatile   │
│   fitness-tracker DB       │     │   AI chat, workout plans     │
└─────────────────────────────┘     └─────────────────────────────┘
```

---

## 5. Backend — In Detail

### 5.1 Server Entry Point (`server.js`)

The backend starts in `server.js` and does the following:
1. **Loads environment variables** from `.env` using `dotenv`
2. **Sets up middleware**: CORS (with whitelisted origins), JSON body parsing, session management
3. **Initializes Passport.js** for Google OAuth authentication
4. **Connects to MongoDB** using Mongoose
5. **Mounts all 9 route files** under `/api/`
6. **Starts Express server** on port 5000 with automatic retry if port is busy

### 5.2 Authentication (`routes/auth.js`)

This is the largest route file (~376 lines). It handles:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | Create a new account (name, email, password) |
| `/api/auth/login` | POST | Login with email/password (supports 2FA) |
| `/api/auth/google` | GET | Initiate Google OAuth login flow |
| `/api/auth/google/callback` | GET | Handle Google OAuth redirect |
| `/api/auth/me` | GET | Get current user profile (requires JWT) |
| `/api/auth/profile` | PUT | Update user profile data (requires JWT) |
| `/api/auth/change-password` | PUT | Change password (requires JWT + current password) |
| `/api/auth/2fa/generate` | POST | Generate QR code for 2FA setup |
| `/api/auth/2fa/verify` | POST | Verify and enable 2FA |
| `/api/auth/2fa/disable` | POST | Disable 2FA (requires current 2FA code) |

**Security features:**
- Passwords are hashed using **bcryptjs** (10 salt rounds)
- JWTs expire in **7 days**
- 2FA uses **TOTP** (Time-based One-Time Password) via the **speakeasy** library
- QR codes are generated using the **qrcode** library

### 5.3 AI Proxy (`routes/ai.js`)

The AI route acts as a **secure proxy** to the Groq API:
- The Groq API key stays on the server (never exposed to the browser)
- Validates request: messages array required, max 50 messages
- Uses `llama-3.3-70b-versatile` model by default
- Returns Groq's response directly to the frontend

### 5.4 Passport Configuration (`config/passport.js`)

Configures **Google OAuth 2.0** strategy:
- Uses `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from environment
- On successful auth: finds existing user by email or creates a new one
- Redirects back to frontend with JWT token as URL parameter

---

## 6. Frontend — In Detail

### 6.1 Entry Point & Routing (`App.jsx`)

The React app uses **React Router v7** with the following setup:

- **Lazy loading**: All pages are loaded on-demand using `React.lazy()` for performance
- **Protected routes**: Dashboard and all feature pages require authentication (JWT in localStorage)
- **Error boundary**: A global `ErrorBoundary` component catches and displays any runtime errors
- **Suspense fallback**: Shows a loading spinner while pages are loading
- **ESC key navigation**: Pressing Escape goes back to the previous page (custom route stack)
- **Toast notifications**: Uses `react-hot-toast` for success/error messages

**Route Map:**

| Path | Page | Auth Required | Description |
|------|------|:---:|-------------|
| `/` | LandingPage | ❌ | Public homepage |
| `/login` | LoginPage | ❌ | Login/Signup form |
| `/auth/callback` | AuthCallback | ❌ | Google OAuth redirect handler |
| `/dashboard` | Dashboard | ✅ | Main dashboard with charts & stats |
| `/workout` | WorkoutTracker | ✅ | Log workout sessions |
| `/diet` | DietTracker | ✅ | Track daily meals & calories |
| `/water` | WaterTracker | ✅ | Track water intake |
| `/progress` | ProgressPage | ✅ | View progress & achievements |
| `/exercises` | ExerciseLibrary | ✅ | Browse exercise database |
| `/calculator` | CalculatorPage | ✅ | Fitness calculators |
| `/profile` | ProfilePage | ✅ | User profile & settings |
| `/workout-plan` | WorkoutPlanGenerator | ✅ | AI workout plan generator |
| `/body-analysis` | BodyAnalysis | ✅ | AI body composition analysis |
| `/ai` | AIAssistant | ✅ | AI fitness chatbot |
| `/timer` | RestTimer | ✅ | Rest interval timer |
| `*` | NotFoundPage | ❌ | 404 error page |

### 6.2 Service Layer (`services/api.js`)

This file contains **every API function** the frontend uses. It provides:

- `signup()`, `login()`, `logout()` — Authentication
- `getWorkouts()`, `saveWorkout()`, `deleteWorkout()` — Workout CRUD
- `getMeals()`, `saveMeal()`, `deleteMeal()` — Meal CRUD
- `getProgress()`, `saveProgress()`, `deleteProgress()` — Progress CRUD
- `getWaterIntake()`, `saveWaterIntake()`, `deleteWaterIntake()` — Water CRUD
- `getFavorites()`, `addFavorite()`, `removeFavorite()` — Favorites
- `getBodyAnalyses()`, `saveBodyAnalysis()`, etc. — Body analysis CRUD
- `getCalculations()`, `saveCalculation()` — Calculator CRUD
- `sendAIMessage()` — AI chatbot
- `generate2FA()`, `verify2FA()`, `disable2FA()` — 2FA management
- `changePassword()` — Password change

Every request includes a **JWT Bearer token** from `localStorage`.

### 6.3 Custom Hook (`hooks/useApi.js`)

`useApi(endpoint)` is a reusable React hook that:
- Makes authenticated GET requests to the backend
- Returns `{ data, loading, error, refetch }`
- Automatically skips calls if no valid token is present
- Used by Dashboard, Progress, and other pages to fetch data

Also exports: `apiGet()`, `apiPost()`, `apiDelete()` for one-off API calls.

### 6.4 Theme System (`context/ThemeContext.jsx`)

- Supports **Dark mode** (default) and **Light mode**
- Persisted in `localStorage`
- Dashboard also has **4 color accent themes**: Mint, Ice, Copper, Crimson

---

## 7. Features Breakdown

### 7.1 🏠 Landing Page
- Cinematic dark design with custom cursor tracking
- Spotlight card effects (mouse-following radial gradients)
- Animated stat bars (Hypertrophy, Recovery, Intensity)
- Marquee text animation ("START NOW")
- Version badge (V.2.0.1)

### 7.2 🔐 Login/Signup Page
- Animated **warp speed starfield** background (HTML Canvas)
- **Hacker text** scramble effect on hover
- 3D card tilt following mouse movement (Framer Motion)
- Google OAuth button
- Two-Factor Authentication input
- "Skip Auth" demo mode
- Form validation with error messages
- Warp-forward animation on successful login

### 7.3 📊 Dashboard
- **FORGE design system** — industrial control-room aesthetic
- Left sidebar with navigation icons
- Header with clock, greeting, theme switcher, AI assistant button
- Background gym imagery with parallax effects
- **Ring progress indicators** for calories, protein, water
- **7-day calorie chart** (Recharts AreaChart)
- **Weight trend chart** from progress logs
- **Quick links grid** (7 feature shortcuts)
- **Recent workouts** list with volume/calorie stats
- **Weekly summary** (sessions, volume, calories)
- **BMI display** calculated from profile data
- **Workout streak** counter
- **Motivational quotes** rotating every 7 seconds

### 7.4 💪 Workout Tracker
- Start/stop workout sessions
- Add exercises from a categorized list
- Log sets with weight and reps
- Track total volume, calories burned, duration
- Save workout to MongoDB
- View workout history

### 7.5 🍎 Diet Tracker
- Log meals with name, calories, protein, carbs, fat
- Categorize by meal type (breakfast, lunch, dinner, snack)
- AI-powered meal suggestions
- Daily macro tracking with visual progress bars
- View meals by date

### 7.6 💧 Water Tracker
- Visual water bottle filling animation
- Log water intake in glasses (250ml each)
- Daily goal tracking (default 2000ml)
- History view
- Saved to MongoDB per day (unique index on userId + date)

### 7.7 📈 Progress Page
- Weight progress chart over time
- Body measurements tracking (chest, waist, hips, arms, legs)
- Body fat percentage logging
- Achievement system with unlock milestones
- **PDF export** for progress reports (jsPDF + jspdf-autotable)
- Confetti celebration on achievements

### 7.8 📚 Exercise Library
- 100+ exercises with detailed descriptions
- Filter by muscle group and category
- Search functionality
- Favorite exercises (saved to MongoDB)
- Exercise details (instructions, sets, reps)

### 7.9 🧮 Calculator Page
- **BMI Calculator** — Body Mass Index with category (Underweight/Normal/Overweight/Obese)
- **BMR Calculator** — Basal Metabolic Rate using Mifflin-St Jeor equation
- **TDEE Calculator** — Total Daily Energy Expenditure based on activity level
- **Macro Calculator** — Optimal protein/carbs/fat split based on fitness goal
- **Body Fat Calculator** — US Navy Method estimation
- **1RM Calculator** — One Rep Max using Epley formula
- **Water Intake Calculator** — Based on body weight and activity level
- **Calorie Burn Estimator** — MET-based calculation for different activities
- All calculations saved to MongoDB for history

### 7.10 🤖 AI Features

**a) AI Workout Plan Generator**
- User inputs: goal, experience level, days/week, duration, equipment
- Sends prompt to Groq API → receives structured JSON workout plan
- Displays exercises with sets, reps, notes
- **PDF export** of generated plan
- Fallback local data if API is unavailable

**b) AI Body Analysis**
- Save named body analyses with focus areas
- AI generates training recommendations
- History of past analyses

**c) AI Chatbot Assistant**
- Full conversational AI fitness coach
- Uses `llama-3.3-70b-versatile` model via Groq
- Proxied through backend (API key secure)
- Answers questions about workouts, nutrition, form, etc.

### 7.11 ⏱️ Rest Timer
- Configurable rest intervals
- Visual countdown
- Audio/visual notifications

### 7.12 👤 Profile Page
- Three tabs: Personal, Fitness, Settings
- Edit name, email, phone, age, gender
- Fitness metrics: height, weight, goal weight, activity level, fitness goal
- Avatar upload (base64 stored)
- Journey progress bar (current weight → goal weight)
- **Settings tab**:
  - Notification preferences
  - Change password
  - Enable/Disable Two-Factor Authentication (with QR code)
  - Export all data as JSON
  - Sign out

---

## 8. Authentication System

The app uses a **three-layer authentication system**:

### Layer 1: Email/Password (Default)
```
User → POST /api/auth/signup → bcrypt hash → save to MongoDB → return JWT
User → POST /api/auth/login → bcrypt compare → return JWT
```

### Layer 2: Google OAuth 2.0
```
User → GET /api/auth/google → Google consent screen → callback → find/create user → JWT → redirect to frontend
```

### Layer 3: Two-Factor Authentication (2FA)
```
Enable:   User → POST /api/auth/2fa/generate → QR code → scan with authenticator app → verify → enabled
Login:    User → POST /api/auth/login → "requiresTwoFactor" → enter 6-digit TOTP code → verified → JWT
Disable:  User → POST /api/auth/2fa/disable → enter current TOTP code → disabled
```

**JWT tokens** are stored in `localStorage` and sent as `Authorization: Bearer <token>` on every API request. Tokens expire after 7 days.

---

## 9. AI Integration

### How it works:

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│ Frontend │──────→│   Backend    │──────→│  Groq Cloud  │
│ (React)  │       │ /api/ai/chat │       │  LLaMA 3.3   │
│          │←──────│   Proxy      │←──────│  70B Model   │
└──────────┘       └──────────────┘       └──────────────┘
```

1. Frontend sends messages to `/api/ai/chat` with JWT auth
2. Backend validates auth, then forwards to Groq API with server-side API key
3. Groq returns AI-generated response
4. Backend passes response back to frontend

**Why proxy through backend?**
- API key stays on the server (never exposed in browser)
- Can add rate limiting and request validation
- Centralized error handling

**Fallback system:**
- If Groq API fails, the frontend uses local fallback data
- Fallback workouts are categorized by equipment (gym/home/bodyweight) and goal (muscle gain/weight loss)
- Fallback meals are categorized by type (high protein/low calorie)

---

## 10. Database Schema

### Users Collection
```
{
  name: String (required),
  email: String (required, unique),
  password: String (required, bcrypt hashed),
  twoFactorEnabled: Boolean (default: false),
  twoFactorSecret: String,
  profileData: {
    avatar: String,
    age: Number,
    gender: String,
    weight: Number,
    height: Number,
    goalWeight: Number,
    fitnessGoal: String,
    activityLevel: String,
    phone: String
  },
  createdAt: Date
}
```

### Workouts Collection
```
{
  userId: ObjectId (ref: User),
  date: String ("YYYY-MM-DD"),
  exercises: Number,
  completedSets: Number,
  volume: Number (total weight × reps),
  calories: Number (estimated burn),
  duration: Number (minutes),
  workoutData: Array (detailed exercise log),
  createdAt: Date
}
```

### Meals Collection
```
{
  userId: ObjectId (ref: User),
  date: String ("YYYY-MM-DD"),
  name: String (required),
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  mealType: String ("breakfast" | "lunch" | "dinner" | "snack"),
  createdAt: Date
}
```

### Progress Collection
```
{
  userId: ObjectId (ref: User),
  date: String ("YYYY-MM-DD"),
  weight: Number,
  bodyFat: Number,
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    arms: Number,
    legs: Number
  },
  photos: [String],
  notes: String,
  createdAt: Date
}
```

### Water Collection
```
{
  userId: ObjectId (ref: User),
  date: String ("YYYY-MM-DD"),
  amount: Number (ml),
  goal: Number (default: 2000ml),
  createdAt: Date
}
Index: { userId + date } → unique
```

### Favorites Collection
```
{
  userId: ObjectId (ref: User),
  exerciseId: String (required),
  exerciseName: String (required),
  category: String,
  createdAt: Date
}
Index: { userId + exerciseId } → unique
```

### BodyAnalysis Collection
```
{
  userId: ObjectId (ref: User),
  name: String (required),
  photoUrl: String,
  focusAreas: [String],
  trainingPlan: String,
  date: Date,
  createdAt: Date
}
Index: { userId }
```

### Calculations Collection
```
{
  userId: ObjectId (ref: User),
  calculationType: String (required — "BMI", "BMR", "TDEE", etc.),
  inputs: Object (the values entered),
  results: Object (the calculated output),
  date: Date,
  createdAt: Date
}
Index: { userId + calculationType }
```

---

## 11. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login (supports 2FA) |
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/me` | Get current user [Auth] |
| PUT | `/api/auth/profile` | Update profile [Auth] |
| PUT | `/api/auth/change-password` | Change password [Auth] |
| POST | `/api/auth/2fa/generate` | Generate 2FA QR code [Auth] |
| POST | `/api/auth/2fa/verify` | Enable 2FA [Auth] |
| POST | `/api/auth/2fa/disable` | Disable 2FA [Auth] |

### Data CRUD (all require Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workouts` | Get all workouts |
| POST | `/api/workouts` | Save a workout |
| DELETE | `/api/workouts/:id` | Delete a workout |
| GET | `/api/meals` | Get all meals |
| GET | `/api/meals/date/:date` | Get meals by date |
| POST | `/api/meals` | Save a meal |
| DELETE | `/api/meals/:id` | Delete a meal |
| GET | `/api/progress` | Get all progress entries |
| POST | `/api/progress` | Save progress |
| DELETE | `/api/progress/:id` | Delete progress |
| GET | `/api/water` | Get all water entries |
| GET | `/api/water/today` | Get today's water |
| POST | `/api/water` | Save water intake |
| DELETE | `/api/water/:id` | Delete water entry |
| GET | `/api/favorites` | Get favorites |
| POST | `/api/favorites` | Add favorite |
| DELETE | `/api/favorites/:id` | Remove favorite |
| GET | `/api/body-analysis` | Get all analyses |
| GET | `/api/body-analysis/:id` | Get one analysis |
| POST | `/api/body-analysis` | Save analysis |
| PUT | `/api/body-analysis/:id` | Update analysis |
| DELETE | `/api/body-analysis/:id` | Delete analysis |
| GET | `/api/calculations` | Get all calculations |
| GET | `/api/calculations/:type` | Get by type |
| POST | `/api/calculations` | Save calculation |
| DELETE | `/api/calculations/:id` | Delete calculation |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Send message to AI [Auth] |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## 12. Design System & UI

The app uses the **"FORGE" design system** — an industrial, high-energy gym aesthetic:

**Design principles:**
- Dark backgrounds (`#000000`, `#0a0a0a`, `#18181b`)
- Accent colors that can be switched (Mint, Ice, Copper, Crimson)
- Monospace font accents (JetBrains Mono) for labels and data
- Primary font: Space Grotesk
- Uppercase bold labels with wide letter-spacing
- Industrial borders and inset shadows
- Subtle grid patterns as background texture
- Glassmorphism effects (backdrop-blur)

**Animation patterns:**
- Page transitions via Framer Motion (`initial → animate → exit`)
- Skeleton loading states for every page
- Confetti celebrations for achievements
- Ring progress indicators for circular stats
- Warp speed effect on login
- Mouse-tracking spotlight cards on landing page

---

## 13. How to Run the Project

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (local install or MongoDB Atlas cloud account)
- **npm** (comes with Node.js)

### Step 1: Backend Setup
```bash
cd fitness-tracker-frontend/backend
npm install
```

Create a `.env` file (copy from `.env.example`):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/fitness-tracker
JWT_SECRET=your-secret-key-change-this-in-production
SESSION_SECRET=session-secret-key
CORS_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GROQ_API_KEY=your-groq-api-key
```

Start the backend:
```bash
npm run dev
```
→ Backend runs on **http://localhost:5000**

### Step 2: Frontend Setup
```bash
cd fitness-tracker-frontend
npm install
```

Start the frontend:
```bash
npm run dev
```
→ Frontend runs on **http://localhost:5173**

### Step 3: Open the App
Open **http://localhost:5173** in your browser.

---

## 14. Environment Variables

### Backend (`.env`)
| Variable | Required | Description |
|----------|:--------:|-------------|
| `PORT` | ❌ | Server port (default: 5000) |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs |
| `SESSION_SECRET` | ❌ | Express session secret |
| `CORS_ORIGINS` | ❌ | Allowed frontend origins (comma-separated) |
| `FRONTEND_URL` | ❌ | Frontend URL for OAuth redirects |
| `GOOGLE_CLIENT_ID` | ❌* | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌* | Google OAuth client secret |
| `GROQ_API_KEY` | ❌* | Groq API key for AI features |

*Required only if using those features.

### Frontend (`.env`)
| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_API_URL` | ❌ | Backend API URL (default: `http://localhost:5000/api`) |

---

## 15. Key Libraries Used

### Backend
| Library | Purpose |
|---------|---------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM (Object Document Mapper) |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT creation and verification |
| `passport` | Authentication middleware |
| `passport-google-oauth20` | Google OAuth 2.0 strategy |
| `speakeasy` | TOTP-based Two-Factor Authentication |
| `qrcode` | QR code generation for 2FA setup |
| `cors` | Cross-Origin Resource Sharing |
| `dotenv` | Environment variable loading |
| `express-session` | Session management for Passport |
| `axios` | HTTP client (for external API calls) |
| `nodemon` | Auto-restart server on code changes (dev) |

### Frontend
| Library | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `bootstrap` | CSS framework (grid, components) |
| `framer-motion` | Animation library |
| `recharts` | Chart library (area charts, etc.) |
| `lucide-react` | Icon library |
| `react-hot-toast` | Toast notifications |
| `react-countup` | Animated number counting |
| `date-fns` | Date utility functions |
| `jspdf` + `jspdf-autotable` | PDF generation |
| `canvas-confetti` | Confetti particle effects |
| `tailwindcss` | Utility-first CSS framework |
| `@vitejs/plugin-react` | Vite plugin for React |

---

## 🎯 Summary

This is a **production-grade, full-stack MERN application** with:
- ✅ 16 React pages with lazy loading
- ✅ 8 MongoDB collections
- ✅ 9 Express route files with 30+ API endpoints
- ✅ 3-layer authentication (Email + Google OAuth + 2FA)
- ✅ AI-powered features (workout plans, diet suggestions, chatbot)
- ✅ Real-time data visualization (charts, progress indicators)
- ✅ PDF export capability
- ✅ Dark/Light theme with 4 accent color options
- ✅ Responsive design
- ✅ Demo mode for quick testing without signup
- ✅ Loading skeletons and error boundaries for polished UX

**Total codebase:** ~500KB+ of application code across frontend and backend.
