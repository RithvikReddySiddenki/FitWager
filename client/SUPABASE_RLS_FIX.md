# Supabase RLS Policy Fix Guide

## Common Issues Fixed

### 1. Column Name Mismatch ✅ FIXED
- **Issue**: Code was using `isPublic` (camelCase) but Supabase uses `is_public` (snake_case)
- **Fix**: Updated `listChallenges()` to use `is_public` column name
- **Location**: `client/src/lib/db/storage.ts` line 239

### 2. URL Trailing Slash ✅ FIXED
- **Issue**: Supabase URL with trailing slash can cause connection issues
- **Fix**: Automatically removes trailing slash from URL
- **Location**: `client/src/lib/db/storage.ts` in `getSupabaseClient()`

### 3. Better Error Logging ✅ ADDED
- **Issue**: Errors weren't providing enough detail
- **Fix**: Added detailed error logging with RLS-specific messages
- **Location**: `client/src/lib/db/storage.ts` in `upsertChallenge()` and `listChallenges()`

## Required Supabase RLS Policies

Since you're using the **service_role key** (which bypasses RLS), these policies are optional but recommended for production.

### For `competitions` Table

If you want to enable RLS (recommended for production), create these policies:

#### 1. Allow anyone to read public competitions
```sql
CREATE POLICY "Anyone can view public competitions"
ON competitions
FOR SELECT
USING (is_public = true);
```

#### 2. Allow creators to manage their own competitions
```sql
CREATE POLICY "Creators can manage their competitions"
ON competitions
FOR ALL
USING (creator = current_setting('request.jwt.claims', true)::json->>'wallet');
```

#### 3. Allow service role to do everything (if using service key)
```sql
-- This is automatically handled by service_role key
-- No policy needed - service_role bypasses RLS
```

### For `users` Table

```sql
CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
USING (id = current_setting('request.jwt.claims', true)::json->>'wallet');

CREATE POLICY "Users can update their own data"
ON users
FOR UPDATE
USING (id = current_setting('request.jwt.claims', true)::json->>'wallet');
```

## Quick Fix: Disable RLS (Development Only)

If you want to quickly test without RLS:

```sql
-- ⚠️ WARNING: Only for development!
ALTER TABLE competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE verifications DISABLE ROW LEVEL SECURITY;
```

**⚠️ Re-enable RLS before production!**

## Verify Your Setup

### 1. Check Service Key is Being Used
Look for this in your server logs:
```
[Storage] Supabase client initialized: { url: 'https://...', hasKey: true }
```

### 2. Test Insert
Create a challenge and check logs:
```
[Storage] Upserting challenge to Supabase: { id: '...', name: '...', is_public: true }
[Storage] Challenge upserted successfully: ...
```

### 3. Test Select
Check public challenges page - should see:
```
[Storage] Supabase list error: (if there's an error)
```

## Troubleshooting

### Error: "permission denied for table competitions"
**Solution**: 
- Make sure you're using `SUPABASE_SERVICE_KEY` (not anon key) in `.env`
- Service key bypasses RLS automatically
- If still failing, check RLS is disabled or policies are set correctly

### Error: "column 'isPublic' does not exist"
**Solution**: ✅ Already fixed - code now uses `is_public`

### Challenges not appearing
**Check**:
1. Are challenges being saved? Check server logs for `[Storage] Challenge upserted successfully`
2. Are they marked as public? Check `is_public = true` in Supabase dashboard
3. Is the query filtering correctly? Check `listChallenges({ isPublic: true })`

### Empty results but no errors
**Possible causes**:
1. RLS blocking reads (if not using service key)
2. All challenges are `is_public = false`
3. Status filter is excluding them (check `status = 'active'`)

## Testing Checklist

- [ ] Service key is in `.env` file (not `.env.local`)
- [ ] Supabase URL has no trailing slash (auto-fixed now)
- [ ] Challenges are being inserted (check logs)
- [ ] Challenges are being retrieved (check logs)
- [ ] `is_public` column exists in Supabase table
- [ ] RLS is disabled OR policies allow service_role access
