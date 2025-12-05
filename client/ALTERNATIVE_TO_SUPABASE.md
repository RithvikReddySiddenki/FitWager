# Alternative to Supabase - SQLite Implementation

## ✅ SQLite is Now Your Default Database!

I've implemented **SQLite** as a replacement for Supabase. It's:
- ✅ **No external service** - Everything is local
- ✅ **No network required** - Works offline
- ✅ **Better than JSON files** - Proper SQL database
- ✅ **Faster** - No network latency
- ✅ **Simpler** - No API keys or setup needed

## What Changed

### 1. New SQLite Database Layer ✅
- **File**: `client/src/lib/db/sqlite.ts`
- **Purpose**: Local SQLite database operations
- **Location**: `client/.fitwager_data/fitwager.db`

### 2. Updated Storage Layer ✅
- **File**: `client/src/lib/db/storage.ts`
- **Change**: Now uses SQLite by default (instead of Supabase)
- **Fallback**: File storage if SQLite fails

### 3. Automatic Table Creation ✅
SQLite automatically creates these tables on first use:
- `users` - User accounts
- `competitions` - Challenges
- `participants` - Challenge participants
- `verifications` - Fitness verifications

## How It Works

### Storage Priority:
1. **SQLite** (default) - Local database file
2. **File Storage** (fallback) - JSON files if SQLite fails
3. **Supabase** (optional) - Only if `USE_SUPABASE=true` is set

### To Use SQLite (Default):
```env
# .env - Just leave it empty or remove Supabase keys
NODE_ENV=development
```

### To Use Supabase (Optional):
```env
# .env - Only if you want Supabase
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

## Benefits

### vs Supabase:
- ✅ No external service needed
- ✅ No network required
- ✅ No API keys to manage
- ✅ Works offline
- ✅ Faster (no network latency)
- ✅ Easier to backup (just copy .db file)

### vs JSON Files:
- ✅ Proper SQL queries
- ✅ Better performance
- ✅ Foreign key relationships
- ✅ Indexes for fast queries
- ✅ ACID transactions

## Database Location

```
client/.fitwager_data/fitwager.db
```

This is a single SQLite database file containing all your data.

## Viewing Your Data

### Option 1: DB Browser for SQLite
1. Download from: https://sqlitebrowser.org/
2. Open `client/.fitwager_data/fitwager.db`
3. Browse tables and run queries

### Option 2: VS Code Extension
Install "SQLite Viewer" extension to view the database in VS Code

### Option 3: Command Line
```bash
cd client/.fitwager_data
sqlite3 fitwager.db

# Run queries:
SELECT * FROM competitions;
SELECT * FROM participants WHERE challengeId = '...';
```

## Backup

Just copy the database file:
```bash
# Backup
cp client/.fitwager_data/fitwager.db client/.fitwager_data/fitwager.db.backup

# Restore
cp client/.fitwager_data/fitwager.db.backup client/.fitwager_data/fitwager.db
```

## Migration

### From Supabase to SQLite:
1. Remove Supabase keys from `.env`
2. Restart server
3. SQLite will be used automatically
4. Old data in Supabase stays there (you can export if needed)

### From JSON Files to SQLite:
1. SQLite will be used automatically
2. Old JSON data stays in `.fitwager_data/challenges.json`
3. New data goes to SQLite

## Troubleshooting

### "Cannot find module 'better-sqlite3'"
**Solution**: Run `npm install` in the `client` directory

### Database locked error
**Solution**: Make sure only one server instance is running

### Want to reset database
**Solution**: Delete `client/.fitwager_data/fitwager.db` and restart server

## Summary

✅ **SQLite is now your default database!**

- No Supabase needed
- No network required  
- Works offline
- Faster and simpler
- Better than JSON files

**Just restart your dev server and it will use SQLite automatically!** 🎉

No more `TypeError: fetch failed` errors - everything is local now!
