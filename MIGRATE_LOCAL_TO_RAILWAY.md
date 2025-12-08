# Migrate Data from Local Database to Railway

This guide shows you how to export data from your local database and import it into Railway Postgres.

## 🎯 Overview

There are several methods to migrate data:
1. **Export as SQL INSERT statements** (recommended for small datasets)
2. **Export as CSV and convert to INSERT statements**
3. **Use pg_dump and pg_restore** (best for large datasets)

## Method 1: Export as SQL INSERT Statements (Recommended)

### Step 1: Connect to Your Local Database

Using pgAdmin 4 or psql:

```sql
-- Connect to your local database
psql -h localhost -U your_username -d your_database_name
```

### Step 2: Generate INSERT Statements

Run these queries to generate INSERT statements for each table:

#### For Users Table:

```sql
-- Export users as INSERT statements
SELECT 
  'INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(email) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal(password) || ', ' ||
  COALESCE(quote_literal("universityId"), 'NULL') || ', ' ||
  quote_literal(role::text) || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ');'
FROM users;
```

#### For Courses Table:

```sql
-- Export courses as INSERT statements
SELECT 
  'INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(code) || ', ' ||
  quote_literal(name) || ', ' ||
  credits || ', ' ||
  quote_literal("levelId") || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ');'
FROM courses;
```

#### For Sections Table:

```sql
-- Export sections as INSERT statements
SELECT 
  'INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal("courseId") || ', ' ||
  quote_literal("instructorId") || ', ' ||
  COALESCE(quote_literal("roomId"), 'NULL') || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ');'
FROM sections;
```

#### For Rooms Table:

```sql
-- Export rooms as INSERT statements
SELECT 
  'INSERT INTO rooms (id, name, capacity, location, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  capacity || ', ' ||
  COALESCE(quote_literal(location), 'NULL') || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ');'
FROM rooms;
```

#### For Levels Table:

```sql
-- Export levels as INSERT statements
SELECT 
  'INSERT INTO levels (id, name, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ');'
FROM levels;
```

#### For Assignments Table:

```sql
-- Export assignments as INSERT statements
SELECT 
  'INSERT INTO assignments (id, "studentId", "sectionId", "courseId", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("studentId") || ', ' ||
  quote_literal("sectionId") || ', ' ||
  quote_literal("courseId") || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ');'
FROM assignments;
```

### Step 3: Copy the Results

1. **In pgAdmin**: Right-click the query result → **Copy** → **Copy as CSV** or select all and copy
2. **In psql**: The results will be displayed - copy them
3. **Save to a file**: Save all INSERT statements to a `.sql` file

### Step 4: Import into Railway

1. **Connect to Railway database** (using pgAdmin or psql)
2. **Run the INSERT statements** in order:
   - First: Levels (if needed)
   - Then: Users
   - Then: Courses
   - Then: Rooms
   - Then: Sections
   - Finally: Assignments (and other dependent tables)

## Method 2: Using pg_dump (Best for Large Datasets)

### Step 1: Export from Local Database

```bash
# Export only data (no schema) as INSERT statements
pg_dump -h localhost -U your_username -d your_database_name \
  --data-only \
  --column-inserts \
  -f local_data_export.sql
```

Or export as custom format (compressed):

```bash
# Export data as custom format
pg_dump -h localhost -U your_username -d your_database_name \
  --data-only \
  -F c \
  -f local_data_export.dump
```

### Step 2: Import into Railway

#### Option A: Using SQL file

1. **Get Railway connection details**:
   - Go to Railway → Postgres → Variables
   - Note: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

2. **Import using psql**:
   ```bash
   # Set password
   export PGPASSWORD="your_railway_password"
   
   # Import SQL file
   psql -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway -f local_data_export.sql
   ```

#### Option B: Using custom format dump

```bash
# Set password
export PGPASSWORD="your_railway_password"

# Restore from dump
pg_restore -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway \
  --data-only \
  --no-owner \
  --no-acl \
  local_data_export.dump
```

## Method 3: Complete Export Script

Here's a complete SQL script that exports all tables:

```sql
-- ============================================
-- Export All Tables as INSERT Statements
-- Run this in your local database
-- ============================================

-- Export Levels
\copy (SELECT 'INSERT INTO levels (id, name, "createdAt", "updatedAt") VALUES (' || quote_literal(id) || ', ' || quote_literal(name) || ', ' || quote_literal("createdAt") || ', ' || quote_literal("updatedAt") || ');' FROM levels) TO 'levels_inserts.sql'

-- Export Users
\copy (SELECT 'INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt") VALUES (' || quote_literal(id) || ', ' || quote_literal(email) || ', ' || quote_literal(name) || ', ' || quote_literal(password) || ', ' || COALESCE(quote_literal("universityId"), 'NULL') || ', ' || quote_literal(role::text) || ', ' || quote_literal("createdAt") || ', ' || quote_literal("updatedAt") || ');' FROM users) TO 'users_inserts.sql'

-- Export Courses
\copy (SELECT 'INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES (' || quote_literal(id) || ', ' || quote_literal(code) || ', ' || quote_literal(name) || ', ' || credits || ', ' || quote_literal("levelId") || ', ' || quote_literal("createdAt") || ', ' || quote_literal("updatedAt") || ');' FROM courses) TO 'courses_inserts.sql'

-- Export Rooms
\copy (SELECT 'INSERT INTO rooms (id, name, capacity, location, "createdAt", "updatedAt") VALUES (' || quote_literal(id) || ', ' || quote_literal(name) || ', ' || capacity || ', ' || COALESCE(quote_literal(location), 'NULL') || ', ' || quote_literal("createdAt") || ', ' || quote_literal("updatedAt") || ');' FROM rooms) TO 'rooms_inserts.sql'

-- Export Sections
\copy (SELECT 'INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES (' || quote_literal(id) || ', ' || quote_literal(name) || ', ' || quote_literal("courseId") || ', ' || quote_literal("instructorId") || ', ' || COALESCE(quote_literal("roomId"), 'NULL') || ', ' || quote_literal("createdAt") || ', ' || quote_literal("updatedAt") || ');' FROM sections) TO 'sections_inserts.sql'

-- Export Assignments
\copy (SELECT 'INSERT INTO assignments (id, "studentId", "sectionId", "courseId", "createdAt", "updatedAt") VALUES (' || quote_literal(id) || ', ' || quote_literal("studentId") || ', ' || quote_literal("sectionId") || ', ' || quote_literal("courseId") || ', ' || quote_literal("createdAt") || ', ' || quote_literal("updatedAt") || ');' FROM assignments) TO 'assignments_inserts.sql'
```

## Method 4: Using pgAdmin 4 (Easiest)

### Step 1: Export from Local Database

1. **Open pgAdmin 4** and connect to your local database
2. **Right-click on your database** → **Backup...**
3. **Configure backup**:
   - **Filename**: `local_backup.sql`
   - **Format**: `Plain`
   - **Encoding**: `UTF8`
   - **Dump Options** → **Data Options**:
     - ✅ **Only data** (uncheck "Only schema")
     - ✅ **Use INSERT commands**
   - **Dump Options** → **Do not save**:
     - ✅ **Owner**
     - ✅ **Privilege**
4. **Click "Backup"**
5. **Wait for backup to complete**

### Step 2: Import into Railway

1. **Connect to Railway database** in pgAdmin (using TCP Proxy)
2. **Right-click on Railway database** → **Restore...**
3. **Configure restore**:
   - **Filename**: Select `local_backup.sql`
   - **Format**: `Plain`
   - **Restore Options** → **Do not save**:
     - ✅ **Owner**
     - ✅ **Privilege**
4. **Click "Restore"**
5. **Wait for restore to complete**

## 📋 Complete Migration Script

Here's a ready-to-use script that exports all your data:

```sql
-- ============================================
-- Export All Data from Local Database
-- Run this in your LOCAL database
-- ============================================

-- Set output format
\pset format unaligned
\pset tuples_only on
\o local_to_railway_export.sql

-- Start transaction
BEGIN;

-- Export in dependency order

-- 1. Levels (no dependencies)
SELECT 'INSERT INTO levels (id, name, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;'
FROM levels;

-- 2. Users (no dependencies)
SELECT 'INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(email) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal(password) || ', ' ||
  COALESCE(quote_literal("universityId"), 'NULL') || ', ' ||
  quote_literal(role::text) || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (email) DO NOTHING;'
FROM users;

-- 3. Rooms (no dependencies)
SELECT 'INSERT INTO rooms (id, name, capacity, location, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  capacity || ', ' ||
  COALESCE(quote_literal(location), 'NULL') || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (name) DO NOTHING;'
FROM rooms;

-- 4. Courses (depends on levels)
SELECT 'INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(code) || ', ' ||
  quote_literal(name) || ', ' ||
  credits || ', ' ||
  quote_literal("levelId") || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (code) DO NOTHING;'
FROM courses;

-- 5. Sections (depends on courses, users, rooms)
SELECT 'INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  quote_literal("courseId") || ', ' ||
  quote_literal("instructorId") || ', ' ||
  COALESCE(quote_literal("roomId"), 'NULL') || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;'
FROM sections;

-- 6. Assignments (depends on users, sections, courses)
SELECT 'INSERT INTO assignments (id, "studentId", "sectionId", "courseId", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("studentId") || ', ' ||
  quote_literal("sectionId") || ', ' ||
  quote_literal("courseId") || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT ("studentId", "sectionId") DO NOTHING;'
FROM assignments;

-- 7. Section Meetings (depends on sections)
SELECT 'INSERT INTO section_meetings (id, "sectionId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("sectionId") || ', ' ||
  quote_literal("dayOfWeek") || ', ' ||
  quote_literal("startTime") || ', ' ||
  quote_literal("endTime") || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;'
FROM section_meetings;

-- 8. Preferences (depends on users)
SELECT 'INSERT INTO preferences (id, "userId", type, value, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("userId") || ', ' ||
  quote_literal(type) || ', ' ||
  quote_literal(value) || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;'
FROM preferences;

-- 9. Feedback (depends on users)
SELECT 'INSERT INTO feedback (id, "userId", content, rating, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("userId") || ', ' ||
  quote_literal(content) || ', ' ||
  COALESCE(rating::text, 'NULL') || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;'
FROM feedback;

-- 10. Notifications (depends on users)
SELECT 'INSERT INTO notifications (id, "userId", title, message, read, "createdAt", "updatedAt") VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal("userId") || ', ' ||
  quote_literal(title) || ', ' ||
  quote_literal(message) || ', ' ||
  read || ', ' ||
  quote_literal("createdAt") || ', ' ||
  quote_literal("updatedAt") || ') ON CONFLICT (id) DO NOTHING;'
FROM notifications;

-- End transaction
COMMIT;

-- Reset output
\o
\pset format aligned
\pset tuples_only off
```

## 🚀 Quick Steps Summary

### Export from Local:

1. **Connect to local database** (pgAdmin or psql)
2. **Run the export script above** (or use pg_dump)
3. **Save the output** to a `.sql` file

### Import to Railway:

1. **Get Railway connection details**:
   - Host: TCP Proxy host (e.g., `yamanote.proxy.rlwy.net`)
   - Port: TCP Proxy port (e.g., `16811`)
   - Database: `railway`
   - Username: `postgres`
   - Password: From Railway → Postgres → Variables

2. **Connect to Railway** (pgAdmin or psql)

3. **Run the SQL file**:
   ```bash
   psql -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway -f local_to_railway_export.sql
   ```

## ⚠️ Important Notes

1. **Dependency Order**: Always import tables in dependency order:
   - Levels → Users → Rooms → Courses → Sections → Assignments

2. **ON CONFLICT**: The scripts use `ON CONFLICT DO NOTHING` to avoid errors if data already exists

3. **Foreign Keys**: Make sure parent records exist before inserting child records

4. **Timestamps**: The scripts preserve original timestamps from your local database

5. **Passwords**: User passwords are copied as-is (bcrypt hashes), so they'll work in Railway

## ✅ Verification

After importing:

1. **Check row counts**:
   ```sql
   SELECT 'users' as table_name, COUNT(*) as count FROM users
   UNION ALL
   SELECT 'courses', COUNT(*) FROM courses
   UNION ALL
   SELECT 'sections', COUNT(*) FROM sections;
   ```

2. **Test login** with imported users

3. **Verify relationships** (sections have valid courses, etc.)

## 🎯 Recommended Approach

For most cases, I recommend **Method 1** (SQL INSERT statements) because:
- ✅ Easy to review and edit
- ✅ Can selectively import specific tables
- ✅ Works well with pgAdmin 4
- ✅ Can add `ON CONFLICT` clauses to avoid duplicates


