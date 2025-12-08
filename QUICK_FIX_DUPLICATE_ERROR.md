# Quick Fix: Duplicate Key Error

## 🚨 Error

```
ERROR: duplicate key value violates unique constraint "levels_pkey"
Key (id)=(level-1) already exists.
```

## ✅ Solution

The error occurs because some data already exists in your database. You have two options:

### Option 1: Clear Existing Data (Recommended for Fresh Start)

If you want to start fresh, run this first:

```sql
-- Clear all data (in correct order due to foreign keys)
TRUNCATE TABLE assignments, section_meetings, sections, courses, rooms, time_slots, users, levels CASCADE;
```

Then run the `seed_complete_database.sql` script.

### Option 2: Skip Existing Records (Recommended if you have important data)

The script has been fixed to use `ON CONFLICT (id) DO NOTHING` which will skip records that already exist. 

**Just run the script again** - it will:
- ✅ Skip records that already exist
- ✅ Insert only new records
- ✅ Not cause errors

### Option 3: Delete Specific Tables

If you only want to reseed certain tables:

```sql
-- Delete only what you want to reseed
DELETE FROM assignments;
DELETE FROM section_meetings;
DELETE FROM sections;
DELETE FROM courses;
DELETE FROM rooms;
DELETE FROM time_slots;
DELETE FROM users WHERE role != 'COMMITTEE'; -- Keep committee users if needed
DELETE FROM levels;
```

Then run the seed script.

## 🔍 Check What Data Exists

Run this to see what's already in your database:

```sql
SELECT 'Levels' as table_name, COUNT(*) as count FROM levels
UNION ALL SELECT 'Users', COUNT(*) FROM users
UNION ALL SELECT 'Rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'Courses', COUNT(*) FROM courses
UNION ALL SELECT 'Sections', COUNT(*) FROM sections
UNION ALL SELECT 'Section Meetings', COUNT(*) FROM section_meetings
UNION ALL SELECT 'Assignments', COUNT(*) FROM assignments;
```

## ✅ Fixed Script

The `seed_complete_database.sql` script has been updated to:
- Use `ON CONFLICT (id) DO NOTHING` for levels (primary key)
- Use `ON CONFLICT (email) DO NOTHING` for users (unique constraint)
- Use `ON CONFLICT (code) DO NOTHING` for courses (unique constraint)
- Use `ON CONFLICT (name) DO NOTHING` for rooms (unique constraint)
- Use `ON CONFLICT (id) DO NOTHING` for all other tables

This means you can run the script multiple times safely - it will only insert new records.

## 🚀 Quick Fix Steps

1. **If you want to start fresh:**
   ```sql
   TRUNCATE TABLE assignments, section_meetings, sections, courses, rooms, time_slots, users, levels CASCADE;
   ```
   Then run `seed_complete_database.sql`

2. **If you want to keep existing data:**
   Just run `seed_complete_database.sql` again - it will skip duplicates

3. **If you want to keep some data:**
   Delete only the tables you want to reseed, then run the script

## 📝 Note

The script is now idempotent - you can run it multiple times without errors. It will only add new records that don't already exist.


