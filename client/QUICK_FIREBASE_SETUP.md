# Quick Firebase Setup - Your Config is Ready!

## ✅ Your Firebase Project: fitwager-ceebf

I can see you've already created your Firebase project! Here's how to complete the setup:

## Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **fitwager-ceebf**
3. Click "Build" → "Firestore Database" (in left sidebar)
4. Click "Create database"
5. Choose **"Start in test mode"** (for development)
6. Select a location (choose closest to your users)
7. Click "Enable"

**Note**: Test mode allows all reads/writes. For production, you'll update the security rules.

## Step 2: Add Environment Variables

Add these to your `client/.env.local` file:

```env
# Enable Firebase
USE_FIREBASE=true

# Your Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCPdjnq5h8job2AmYjmvMHiGwC-ewImieg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fitwager-ceebf.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fitwager-ceebf
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fitwager-ceebf.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=320474898400
NEXT_PUBLIC_FIREBASE_APP_ID=1:320474898400:web:640a5320abf6d45d141585
```

## Step 3: Set Up Security Rules (Important!)

1. In Firebase Console, go to Firestore Database → Rules
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Development rules - allow all access
    // TODO: Add authentication for production!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click "Publish"

## Step 4: Restart Your Server

```bash
cd client
npm run dev
```

## Step 5: Test It!

1. Open your app: `http://localhost:3000`
2. Create a challenge
3. Go to Firebase Console → Firestore Database
4. You should see:
   - `competitions` collection (your challenges)
   - `users` collection (user data)
   - `participants` collection (when users join)
   - `verifications` collection (fitness data)

## ✅ That's It!

Your app is now using Firebase! All data will be:
- ✅ Stored in the cloud
- ✅ Shared across all users
- ✅ Accessible from anywhere
- ✅ Perfect for multi-user deployment

## Next Steps for Production

1. **Update Security Rules**: Add authentication checks
2. **Deploy to Vercel**: Add same environment variables
3. **Monitor Usage**: Check Firebase Console for usage stats

## Troubleshooting

### "Firebase configuration is missing"
- Make sure all `NEXT_PUBLIC_FIREBASE_*` variables are in `.env.local`
- Restart your dev server after adding variables

### "Permission denied"
- Check Firestore security rules
- Make sure rules allow read/write (for development)

### Collections not appearing
- Collections are created automatically on first write
- Try creating a challenge first

---

**Your Firebase is ready to use!** 🚀

Just enable Firestore and add the environment variables above.
