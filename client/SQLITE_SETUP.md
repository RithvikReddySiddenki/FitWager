# SQLite Database - Supabase Alternative

## ✅ SQLite is Now Your Default Database!

I've replaced Supabase with **SQLite** - a simple, local database that:
- ✅ **No external service needed** - Everything is local
- ✅ **Works offline** - No network required
- ✅ **Better than JSON files** - Proper SQL queries
- ✅ **Fast and reliable** - No network latency
- ✅ **Easy to backup** - Just copy the `.db` file

## How It Works

### Storage Priority:
1. **SQLite** (default) - Local database file
2. **File Storage** (fallback) - JSON files if SQLite fails
3. **Supabase** (optional) - Only if you set `USE_SUPABASE=true`

### Database Location:
```
client/.fitwager_data/fitwager.db
```

This is a single SQLite database file containing all your data.

## Setup

### 1. Install Dependencies ✅
Already done! I've installed `better-sqlite3` for you.

### 2. No Configuration Needed! ✅
SQLite works automatically - no environment variables required!

### 3. That's It! ✅
Just restart your dev server and SQLite will be used automatically.

## Environment Variables

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

### To Use File Storage Only:
```env
# .env - Remove all database keys
NODE_ENV=development
```

## Database Schema

SQLite automatically creates these tables:

- **users** - User accounts and OAuth tokens
- **competitions** - Challenges/competitions
- **participants** - Challenge participants
- **verifications** - Fitness verification data

All tables are created automatically on first use!

## Benefits Over Supabase

| Feature | Supabase | SQLite |
|---------|----------|--------|
| **Setup** | 10-15 min | 0 min ✅ |
| **External Service** | Required | None ✅ |
| **Network Required** | Yes | No ✅ |
| **Cost** | Free tier | Free ✅ |
| **Backup** | Automatic | Copy .db file ✅ |
| **Offline** | No | Yes ✅ |
| **Speed** | Network latency | Instant ✅ |

## Benefits Over JSON Files

| Feature | JSON Files | SQLite |
|---------|------------|--------|
| **Querying** | Manual filtering | SQL queries ✅ |
| **Performance** | Slow for large data | Fast ✅ |
| **Relationships** | Manual | Foreign keys ✅ |
| **Indexes** | None | Automatic ✅ |
| **Transactions** | None | ACID ✅ |

## Migration from Supabase

If you had data in Supabase:
1. Export data from Supabase
2. Import into SQLite (or just start fresh - SQLite is faster!)

## Backup Your Data

Just copy the database file:
```bash
# Backup
cp client/.fitwager_data/fitwager.db client/.fitwager_data/fitwager.db.backup

# Restore
cp client/.fitwager_data/fitwager.db.backup client/.fitwager_data/fitwager.db
```

## Viewing Your Data

### Option 1: SQLite Browser
1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open `client/.fitwager_data/fitwager.db`
3. Browse tables and run queries

### Option 2: Command Line
```bash
cd client/.fitwager_data
sqlite3 fitwager.db

# Then run SQL queries:
SELECT * FROM competitions;
SELECT * FROM participants;
```

### Option 3: VS Code Extension
Install "SQLite Viewer" extension in VS Code to view the database.

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
