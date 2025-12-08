# Connect pgAdmin 4 to Railway Postgres & Insert Test Data

This guide shows you how to connect pgAdmin 4 to your Railway Postgres database and insert test users (student, faculty, committee).

## 🔌 Step 1: Get Connection Details from Railway

### Option A: Using TCP Proxy (Recommended for External Tools)

1. **Go to Railway → Postgres → Settings → Networking**
2. **Under Public Networking**, you should see a TCP Proxy endpoint
3. **If not visible**, click **"+ TCP Proxy"** to create one
4. **Note the connection details**:
   - **Host**: Something like `yamanote.proxy.rlwy.net`
   - **Port**: Something like `16811`
   - **Username**: Usually `postgres`
   - **Password**: Get from Railway variables
   - **Database**: Usually `railway`

### Option B: Get from Environment Variables

1. **Go to Railway → Postgres → Variables**
2. **Note these values**:
   - `PGHOST` (or use TCP Proxy host)
   - `PGPORT` (or use TCP Proxy port)
   - `PGUSER` (usually `postgres`)
   - `PGPASSWORD` (copy this value)
   - `PGDATABASE` (usually `railway`)

### Option C: Parse DATABASE_URL

1. **Go to Railway → Postgres → Variables**
2. **Copy the `DATABASE_URL`** value
3. It will look like: `postgresql://postgres:password@host:port/railway`
4. Parse it to get:
   - **Host**: The hostname part
   - **Port**: The port number
   - **Username**: `postgres`
   - **Password**: The password part
   - **Database**: `railway`

## 🖥️ Step 2: Connect with pgAdmin 4

### Step 2.1: Open pgAdmin 4

1. Launch **pgAdmin 4** on your computer
2. If you don't have it installed, download from: https://www.pgadmin.org/download/

### Step 2.2: Create a New Server Connection

1. **Right-click** on **"Servers"** in the left panel
2. Select **"Register"** → **"Server..."**

### Step 2.3: General Tab

1. **Name**: Enter a friendly name (e.g., "Railway Postgres" or "SmartSchedule DB")
2. Click **"Connection"** tab

### Step 2.4: Connection Tab

Fill in the connection details:

- **Host name/address**: 
  - Use TCP Proxy host (e.g., `yamanote.proxy.rlwy.net`)
  - OR use `PGHOST` from Railway variables
  
- **Port**: 
  - Use TCP Proxy port (e.g., `16811`)
  - OR use `PGPORT` from Railway variables

- **Maintenance database**: 
  - Usually `railway` or `postgres`
  - OR use `PGDATABASE` from Railway variables

- **Username**: 
  - Usually `postgres`
  - OR use `PGUSER` from Railway variables

- **Password**: 
  - Enter the password from Railway variables (`PGPASSWORD`)
  - Check **"Save password"** if you want pgAdmin to remember it

### Step 2.5: Advanced Tab (Optional)

- **DB restriction**: Leave empty (to see all databases)

### Step 2.6: SSL Tab (Important!)

Since Railway uses SSL connections:

1. Click **"SSL"** tab
2. Set **"SSL mode"** to: **"Require"** or **"Prefer"**
3. Leave other SSL fields empty (Railway handles certificates)

### Step 2.7: Save and Connect

1. Click **"Save"**
2. pgAdmin will attempt to connect
3. If successful, you'll see the database in the left panel
4. Expand it to see tables, schemas, etc.

## 🐛 Troubleshooting Connection Issues

### Error: "Connection refused" or "Could not connect"

**Solutions:**
1. **Check TCP Proxy is enabled**:
   - Go to Railway → Postgres → Settings → Networking
   - Ensure TCP Proxy is created and active
   - Note: You'll be billed for network egress when using TCP Proxy

2. **Verify connection details**:
   - Double-check host, port, username, password
   - Make sure you're using TCP Proxy details (not private network)

3. **Check firewall/network**:
   - Ensure your network allows outbound connections
   - Some corporate networks block database connections

### Error: "SSL connection required"

**Solution:**
- Go to **SSL tab** in pgAdmin connection settings
- Set **SSL mode** to **"Require"** or **"Prefer"**

### Error: "Password authentication failed"

**Solution:**
- Verify the password from Railway → Postgres → Variables → `PGPASSWORD`
- Make sure you copied it correctly (no extra spaces)

## 📊 Step 3: Explore the Database

Once connected:

1. **Expand the server** in the left panel
2. **Expand "Databases"**
3. **Expand your database** (usually `railway`)
4. **Expand "Schemas"** → **"public"**
5. **Expand "Tables"**
6. You should see all your tables:
   - users
   - courses
   - sections
   - rooms
   - etc.

## ✏️ Step 4: Insert Test Data

### Step 4.1: Open Query Tool

1. **Right-click** on your database (e.g., `railway`)
2. Select **"Query Tool"**
3. A SQL query editor will open

### Step 4.2: Insert Test Users

Copy and paste this SQL script into the Query Tool:

```sql
-- Insert test users with different roles
-- Note: Passwords are hashed using bcrypt (you'll need to generate these)

-- First, let's check if we need to insert any required data (like levels)
-- Insert a level if it doesn't exist
INSERT INTO levels (id, name, "createdAt", "updatedAt")
VALUES ('level-1', 'Undergraduate', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert a Student user
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt")
VALUES (
  'student-1',
  'student@example.com',
  'John Student',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- Replace with actual bcrypt hash
  'STU001',
  'STUDENT',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert a Faculty user
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt")
VALUES (
  'faculty-1',
  'faculty@example.com',
  'Dr. Jane Faculty',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- Replace with actual bcrypt hash
  'FAC001',
  'FACULTY',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert a Committee user
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt")
VALUES (
  'committee-1',
  'committee@example.com',
  'Admin Committee',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- Replace with actual bcrypt hash
  'COM001',
  'COMMITTEE',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
```

**⚠️ Important**: The password hashes above are placeholders. You need to generate real bcrypt hashes.

### Step 4.3: Generate Password Hashes

You have two options:

#### Option A: Use Online Bcrypt Generator
1. Go to: https://bcrypt-generator.com/
2. Enter a password (e.g., `password123`)
3. Set rounds to `10`
4. Click "Generate Hash"
5. Copy the hash and replace the placeholder in the SQL

#### Option B: Use Node.js to Generate Hash

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('password123', 10);
console.log(hash);
```

### Step 4.4: Complete SQL Script with Real Hashes

Here's a complete script with example passwords (all set to `password123`):

```sql
-- Insert test users with different roles
-- All passwords are: password123

-- Insert a level if it doesn't exist
INSERT INTO levels (id, name, "createdAt", "updatedAt")
VALUES ('level-1', 'Undergraduate', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert a Student user
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt")
VALUES (
  'student-1',
  'student@example.com',
  'John Student',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
  'STU001',
  'STUDENT',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert a Faculty user
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt")
VALUES (
  'faculty-1',
  'faculty@example.com',
  'Dr. Jane Faculty',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
  'FAC001',
  'FACULTY',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert a Committee user
INSERT INTO users (id, email, name, password, "universityId", role, "createdAt", "updatedAt")
VALUES (
  'committee-1',
  'committee@example.com',
  'Admin Committee',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
  'COM001',
  'COMMITTEE',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
```

### Step 4.5: Execute the Script

1. **Paste the SQL script** into the Query Tool
2. **Click the "Execute" button** (or press F5)
3. You should see: `Query returned successfully`
4. **Verify the data**:
   - Right-click on `users` table → **"View/Edit Data"** → **"All Rows"**
   - You should see the three users you just inserted

## 🔍 Step 5: Verify the Data

### View Users Table

1. **Right-click** on `users` table
2. Select **"View/Edit Data"** → **"All Rows"**
3. You should see:
   - `student@example.com` (STUDENT role)
   - `faculty@example.com` (FACULTY role)
   - `committee@example.com` (COMMITTEE role)

### Test Login

You can now test logging in to your application with:
- **Student**: `student@example.com` / `password123`
- **Faculty**: `faculty@example.com` / `password123`
- **Committee**: `committee@example.com` / `password123`

## 📝 Additional Test Data (Optional)

If you want to add more test data (courses, sections, etc.):

```sql
-- Insert a course
INSERT INTO courses (id, code, name, credits, "levelId", "createdAt", "updatedAt")
VALUES (
  'course-1',
  'CS101',
  'Introduction to Computer Science',
  3,
  'level-1',
  NOW(),
  NOW()
)
ON CONFLICT (code) DO NOTHING;

-- Insert a room
INSERT INTO rooms (id, name, capacity, location, "createdAt", "updatedAt")
VALUES (
  'room-1',
  'Room 101',
  30,
  'Building A',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Insert a section (requires course and faculty to exist)
INSERT INTO sections (id, name, "courseId", "instructorId", "roomId", "createdAt", "updatedAt")
VALUES (
  'section-1',
  'CS101-01',
  'course-1',
  'faculty-1',
  'room-1',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
```

## ⚠️ Important Notes

1. **Password Security**: The example passwords (`password123`) are for testing only. Change them in production!

2. **Bcrypt Hashes**: The hash `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` corresponds to `password123`. Generate your own for different passwords.

3. **Network Egress**: Using TCP Proxy will incur charges for network egress. This is normal for external database connections.

4. **SSL Required**: Railway requires SSL connections. Make sure pgAdmin SSL settings are configured correctly.

5. **Connection Limits**: Railway may have connection limits. Close pgAdmin connections when not in use.

## 🎯 Quick Reference: Connection Details

When setting up pgAdmin, you'll need:

- **Host**: `yamanote.proxy.rlwy.net` (your TCP Proxy host)
- **Port**: `16811` (your TCP Proxy port)
- **Database**: `railway` (or from `PGDATABASE`)
- **Username**: `postgres` (or from `PGUSER`)
- **Password**: (from Railway → Postgres → Variables → `PGPASSWORD`)
- **SSL Mode**: `Require` or `Prefer`

## ✅ Success Checklist

- [ ] TCP Proxy created in Railway
- [ ] pgAdmin 4 installed
- [ ] Server connection created in pgAdmin
- [ ] Successfully connected to Railway database
- [ ] Can see tables in pgAdmin
- [ ] Test users inserted successfully
- [ ] Can view users in pgAdmin table viewer
- [ ] Can login to application with test users

## 🚀 Next Steps

After inserting test users:
1. Test login functionality in your application
2. Verify role-based access control works
3. Add more test data as needed (courses, sections, etc.)
4. Consider creating a seed script for easier test data management


