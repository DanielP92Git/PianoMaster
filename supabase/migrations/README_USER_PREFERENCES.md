# User Preferences Migration

This migration creates the `user_preferences` table for storing user settings.

## Deployment Instructions

### Using Supabase CLI (Recommended)

```bash
# Push the migration to your Supabase project
supabase db push

# Or push to a specific project
supabase db push --project-id your-project-id
```

### Manual Deployment (Alternative)

If you prefer to deploy manually through the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `20250120000000_add_user_preferences.sql`
4. Paste into a new query
5. Click **Run** to execute

## What This Migration Does

1. Creates `user_preferences` table with columns for:
   - Notification preferences (enable/disable, types, quiet hours)
   - Audio preferences (sound enable/disable, master volume)
   - Daily reminder preferences

2. Enables Row Level Security (RLS) with policies:
   - Users can only read their own preferences
   - Users can only insert their own preferences
   - Users can only update their own preferences

3. Adds an `updated_at` trigger for automatic timestamp updates

4. Creates an index on `user_id` for faster lookups

## Verification

After deploying, verify the table was created:

```sql
SELECT * FROM user_preferences LIMIT 1;
```

Check RLS policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_preferences';
```

## Rollback

If you need to rollback this migration:

```sql
DROP TABLE IF EXISTS user_preferences CASCADE;
```

**Warning:** This will permanently delete all user preferences data.
