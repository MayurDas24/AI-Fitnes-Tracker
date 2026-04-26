# 🔐 GOOGLE AUTHENTICATION SETUP GUIDE

## STEP 1: Get Google OAuth Credentials (10 mins)

1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen:
   - User Type: External
   - App name: AI Fitness Tracker
   - Support email: your email
   - Save
6. Create OAuth Client ID:
   - Application type: Web application
   - Name: Fitness Tracker
   - Authorized redirect URIs: 
     - Add: `http://localhost:5000/api/auth/google/callback`
   - Click Create
7. Copy your:
   - Client ID
   - Client Secret

## STEP 2: Update Backend .env

Create `backend/.env` with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/fitness-tracker
JWT_SECRET=your-super-secret-jwt-key-12345
SESSION_SECRET=your-session-secret-key-67890

GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
```

## STEP 3: Install New Dependencies

```bash
cd backend
npm install
```

This installs:
- passport
- passport-google-oauth20  
- express-session

## STEP 4: Start Backend

```bash
npm run dev
```

Should see:
```
✅ MongoDB Connected
🚀 Server running on http://localhost:5000
📡 API endpoints ready:
   - GET  /api/auth/google (Google OAuth)
```

## STEP 5: Test Google Login

1. Start frontend: `npm run dev`
2. Go to login page
3. Click "Sign in with Google"
4. Choose your Google account
5. Should redirect back and login!

## HOW IT WORKS:

1. User clicks "Sign in with Google"
2. Redirects to Google login
3. User selects account
4. Google redirects to `/api/auth/google/callback`
5. Backend creates/finds user in database
6. Generates JWT token
7. Redirects to frontend with token
8. User is logged in!

## WHAT'S DIFFERENT:

**Before:** Email/password only
**Now:** Email/password OR Google (both work!)

Each login method creates/uses the same user based on email.

## IMPORTANT:

- Each user sees ONLY their data (already working)
- Google email becomes the unique identifier
- Password is auto-generated for Google users
- JWT token works the same for both methods

