# SQLite is Now Optional

## ✅ File Storage is the Default

To avoid build issues with native modules in Next.js/Turbopack, **file storage is now the default**. SQLite is available as an optional enhancement.

## How It Works Now

### Default: File Storage ✅
- **No configuration needed** - Just works!
- **No build issues** - Pure JavaScript
- **Data persists** - Saved to `.fitwager_data/challenges.json`
- **Perfect for development** - Fast and simple

### Optional: SQLite
To enable SQLite, set this in your `.env` file:
```env
USE_SQLITE=true
```

Then restart your server.

### Optional: Supabase
To use Supabase instead:
```env
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

## Storage Priority

1. **Supabase** (if `USE_SUPABASE=true`)
2. **SQLite** (if `USE_SQLITE=true` and Supabase not enabled)
3. **File Storage** (default - always works!)

## Why This Change?

`better-sqlite3` is a native Node.js module that requires compilation. Next.js 16 with Turbopack can have issues analyzing native modules during build time, even with lazy loading.

**File storage works perfectly** and doesn't have these issues, so it's now the default. SQLite is available if you want better querying capabilities.

## Benefits of File Storage (Default)

- ✅ **No build issues** - Pure JavaScript
- ✅ **No configuration** - Just works
- ✅ **Fast** - No database overhead
- ✅ **Simple** - Easy to debug and backup
- ✅ **Reliable** - No native module compilation

## When to Use SQLite

Enable SQLite if you need:
- Better querying capabilities
- More complex filtering
- Better performance with large datasets
- SQL-like operations

Just set `USE_SQLITE=true` in your `.env` file!

## Summary

✅ **File storage is now the default** - No configuration needed!
✅ **SQLite is optional** - Enable with `USE_SQLITE=true`
✅ **No more build errors** - Everything just works!

Your app will work perfectly with file storage by default! 🎉
