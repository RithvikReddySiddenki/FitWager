# Firebase Configuration for FitWager

## Your Firebase Config

Based on your Firebase console, here's your configuration:

```env
# Enable Firebase
USE_FIREBASE=true

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCPdjnq5h8job2AmYjmvMHiGwC-ewImieg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fitwager-ceebf.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fitwager-ceebf
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fitwager-ceebf.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=320474898400
NEXT_PUBLIC_FIREBASE_APP_ID=1:320474898400:web:640a5320abf6d45d141585
```

## Quick Setup

### Step 1: Add to `.env.local`

Create or update `client/.env.local` with the above variables.

### Step 2: Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **fitwager-ceebf**
3. Go to "Build" → "Firestore Database"
4. Click "Create database"
5. Choose "Start in test mode" (for development)
6. Select a location
7. Click "Enable"

### Step 3: Set Up Security Rules

Go to Firestore Database → Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    // TODO: Add proper authentication for production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**For Production**: Update rules to require authentication!

### Step 4: Restart Server

```bash
cd client
npm run dev
```

## Verify It's Working

1. Create a challenge in your app
2. Go to Firebase Console → Firestore Database
3. You should see a `competitions` collection
4. Your challenge should appear as a document

## Next Steps

- ✅ Firebase is now your database!
- ✅ All users will share the same data
- ✅ Perfect for multi-user deployment

Your app is now using Firebase! 🎉
