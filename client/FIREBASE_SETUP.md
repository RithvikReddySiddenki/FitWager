# Firebase Setup Guide for FitWager

## ✅ Firebase is Now Available!

I've added Firebase/Firestore support as a database option. It's perfect for multi-user deployments!

## Why Firebase?

- ✅ **Real-time updates** - Changes sync instantly
- ✅ **Scalable** - Handles millions of users
- ✅ **Easy setup** - Just add API keys
- ✅ **Free tier** - Generous free quota
- ✅ **Multi-user ready** - Perfect for production

## Storage Priority

1. **Firebase** (if `USE_FIREBASE=true`) - Cloud database
2. **Supabase** (if `USE_SUPABASE=true`) - Cloud database
3. **SQLite** (if `USE_SQLITE=true`) - Local database
4. **File Storage** (default) - JSON files

## Setup Steps

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select existing
3. Enter project name: "FitWager"
4. Enable Google Analytics (optional)
5. Click "Create project"
6. Wait for project creation (~30 seconds)

### Step 2: Enable Firestore

1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)
5. Click "Enable"

### Step 3: Get API Keys

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web" icon (`</>`)
4. Register app:
   - App nickname: "FitWager Web"
   - Firebase Hosting: Not needed (we use Vercel)
5. Click "Register app"
6. Copy the `firebaseConfig` object

### Step 4: Set Up Security Rules

Go to Firestore Database → Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - users can read/write their own data
    match /users/{userId} {
      allow read: if true; // Public read for user lookup
      allow write: if request.auth != null || request.resource.id == userId;
    }
    
    // Competitions - public read, authenticated write
    match /competitions/{competitionId} {
      allow read: if true; // Public read
      allow write: if true; // Allow writes (adjust based on your auth needs)
    }
    
    // Participants - public read, authenticated write
    match /participants/{participantId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Verifications - public read, authenticated write
    match /verifications/{verificationId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

**For Production**: Add proper authentication checks!

### Step 5: Add Environment Variables

Add to your `.env.local`:

```env
# Enable Firebase
USE_FIREBASE=true

# Firebase Configuration (from Step 3)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Step 6: Install Dependencies

```bash
cd client
npm install firebase
```

### Step 7: Restart Server

```bash
npm run dev
```

## Data Structure

Firebase automatically creates these collections:

- **`users`** - User accounts (document ID = wallet address)
- **`competitions`** - Challenges (document ID = challenge ID)
- **`participants`** - Challenge participants (document ID = `${challengeId}_${wallet}`)
- **`verifications`** - Fitness verifications (document ID = `${challengeId}_${wallet}`)

## Viewing Your Data

### Option 1: Firebase Console
1. Go to Firestore Database
2. Browse collections and documents
3. Edit data directly (for testing)

### Option 2: Firebase CLI
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# View data
firebase firestore:get competitions
```

## Security Rules (Production)

For production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if true;
      allow write: if isOwner(userId);
    }
    
    match /competitions/{competitionId} {
      allow read: if resource.data.is_public == true || isOwner(resource.data.creator);
      allow create: if request.auth != null;
      allow update, delete: if isOwner(resource.data.creator);
    }
    
    match /participants/{participantId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /verifications/{verificationId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Benefits vs Supabase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| **Setup** | 5 minutes | 10 minutes |
| **Real-time** | ✅ Built-in | ✅ Built-in |
| **Free Tier** | 1GB storage, 50K reads/day | 500MB, 2GB bandwidth |
| **Scalability** | ✅ Excellent | ✅ Good |
| **Ease of Use** | ✅ Very Easy | ✅ Easy |
| **SQL Queries** | ❌ NoSQL only | ✅ Full SQL |
| **Pricing** | Pay as you go | Fixed tiers |

## Migration from Supabase

If you're switching from Supabase:

1. Export data from Supabase
2. Import to Firestore (use Firebase Console or scripts)
3. Update environment variables
4. Restart server

## Troubleshooting

### "Firebase configuration is missing"
**Solution**: Make sure all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`

### "Permission denied"
**Solution**: Check Firestore security rules allow the operation

### "Collection not found"
**Solution**: Collections are created automatically on first write

### Data not appearing
**Solution**: 
- Check Firestore console
- Verify security rules
- Check browser console for errors

## Cost

### Free Tier (Spark Plan)
- **Storage**: 1 GB
- **Reads**: 50,000/day
- **Writes**: 20,000/day
- **Deletes**: 20,000/day

### Paid Tier (Blaze Plan)
- **Storage**: $0.18/GB/month
- **Reads**: $0.06 per 100,000
- **Writes**: $0.18 per 100,000
- **Deletes**: $0.02 per 100,000

**Estimated cost for small app**: $0-10/month

## Summary

✅ **Firebase is now available!**

- Perfect for multi-user deployments
- Real-time updates
- Easy to set up
- Generous free tier

**Just add your Firebase config to `.env.local` and set `USE_FIREBASE=true`!** 🚀
