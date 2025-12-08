# How to Export Railway Postgres Database

This guide shows you how to export your Postgres database from Railway for backup or migration purposes.

## 🎯 Methods to Export

There are several ways to export your Railway Postgres database:

### Method 1: Using Railway CLI (Recommended) ⭐

This is the easiest method if you have Railway CLI installed.

#### Step 1: Install Railway CLI (if not already installed)

```bash
# Windows (PowerShell)
iwr https://railway.app/install.sh | iex

# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh
```

#### Step 2: Login to Railway

```bash
railway login
```

#### Step 3: Link to Your Project

```bash
railway link
```

#### Step 4: Export the Database

```bash
# Connect to Postgres and export
railway connect postgres
# Then in the psql prompt:
\copy (SELECT * FROM your_table) TO '/tmp/export.csv' CSV HEADER;

# OR use pg_dump via Railway shell
railway run pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE > backup.sql
```

### Method 2: Using TCP Proxy (External Connection)

This method allows you to connect from your local machine using any PostgreSQL client.

#### Step 1: Enable TCP Proxy in Railway

1. Go to Railway → **Postgres** service → **Settings** → **Networking**
2. Under **Public Networking**, you should see a TCP Proxy endpoint
3. If not visible, click **"+ TCP Proxy"** to create one
4. Note the connection details (host, port)

#### Step 2: Get Connection Details

1. Go to Railway → **Postgres** service → **Variables**
2. Note these values:
   - `PGHOST` (or use the TCP Proxy host)
   - `PGPORT` (or use the TCP Proxy port)
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`

#### Step 3: Export Using pg_dump (Local Machine)

**Windows (PowerShell):**

```powershell
# Install PostgreSQL client tools if needed
# Download from: https://www.postgresql.org/download/windows/

# Export database
$env:PGPASSWORD="your_password_here"
pg_dump -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway -F c -f backup.dump

# Or export as SQL file
pg_dump -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway -f backup.sql
```

**macOS/Linux:**

```bash
# Install PostgreSQL client tools if needed
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Export database
export PGPASSWORD="your_password_here"
pg_dump -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway -F c -f backup.dump

# Or export as SQL file
pg_dump -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway -f backup.sql
```

### Method 3: Using Railway One-Click Shell

This method uses Railway's built-in shell feature.

#### Step 1: Open Railway Shell

1. Go to Railway → **Postgres** service
2. Click on **Deployments** tab
3. Click on the latest deployment
4. Click **"Shell"** or **"One-Click Shell"** button

#### Step 2: Export in Shell

```bash
# Export as SQL
pg_dump -h localhost -U $PGUSER -d $PGDATABASE > /tmp/backup.sql

# Export as custom format (compressed)
pg_dump -h localhost -U $PGUSER -d $PGDATABASE -F c -f /tmp/backup.dump

# Download the file (if Railway allows file download)
# Or copy the output
```

### Method 4: Using psql with COPY Command

If you just want to export specific tables or data:

```bash
# Connect to database
psql -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway

# Export specific table to CSV
\copy users TO '/tmp/users.csv' CSV HEADER;

# Export all tables
\dt  # List all tables
\copy (SELECT * FROM users) TO '/tmp/users.csv' CSV HEADER;
```

## 📋 Export Formats

### SQL Format (Plain Text)
```bash
pg_dump -h host -U user -d database -f backup.sql
```
- **Pros**: Human-readable, easy to edit
- **Cons**: Large file size, not compressed

### Custom Format (Compressed)
```bash
pg_dump -h host -U user -d database -F c -f backup.dump
```
- **Pros**: Compressed, faster, can restore specific tables
- **Cons**: Not human-readable

### Directory Format
```bash
pg_dump -h host -U user -d database -F d -f backup_dir
```
- **Pros**: Most flexible, can restore specific tables
- **Cons**: Creates a directory with multiple files

## 🔍 Quick Export Commands

### Export Everything (Recommended)

```bash
# Using environment variables from Railway
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### Export Schema Only (No Data)

```bash
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -s -f schema_only.sql
```

### Export Data Only (No Schema)

```bash
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -a -f data_only.sql
```

### Export Specific Tables

```bash
pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -t users -t courses -f specific_tables.sql
```

## 🚀 Step-by-Step: Export from Railway (Easiest Method)

### Option A: Using Railway's Built-in Tools

1. **Get Connection String**:
   - Go to Railway → **Postgres** → **Variables**
   - Copy the `DATABASE_URL` value

2. **Use Railway Shell**:
   - Go to Railway → **Postgres** → **Deployments** → Latest deployment
   - Click **"Shell"**
   - Run: `pg_dump $DATABASE_URL > backup.sql`

### Option B: Using Local pg_dump

1. **Install PostgreSQL Client Tools**:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql-client`

2. **Get Connection Details from Railway**:
   - Go to Railway → **Postgres** → **Variables**
   - Note: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

3. **Export**:
   ```bash
   # Windows PowerShell
   $env:PGPASSWORD="your_password"
   pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f backup.sql
   
   # macOS/Linux
   export PGPASSWORD="your_password"
   pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f backup.sql
   ```

## 📦 What Gets Exported?

The export includes:
- ✅ All table schemas (CREATE TABLE statements)
- ✅ All data (INSERT statements)
- ✅ Indexes
- ✅ Foreign key constraints
- ✅ Sequences
- ✅ Functions and triggers (if any)
- ✅ User-defined types and enums

## 🔄 Importing the Export Later

To restore the exported database:

```bash
# From SQL file
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE < backup.sql

# From custom format
pg_restore -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE backup.dump
```

## ⚠️ Important Notes

1. **Network Egress**: Using TCP Proxy may incur charges for network egress
2. **Large Databases**: For very large databases, consider using compressed formats
3. **Backup Regularly**: Set up automated backups if possible
4. **Security**: Never commit database dumps to version control (they may contain sensitive data)

## 🎯 Recommended Approach

For your current situation (exporting Railway Postgres):

1. **Use Railway Shell** (easiest, no local setup needed)
2. **Or use TCP Proxy** with local `pg_dump` (more control)
3. **Export as custom format** (`.dump`) for smaller file size
4. **Include timestamp** in filename for versioning

## 📝 Example: Complete Export Workflow

```bash
# 1. Set password (Windows PowerShell)
$env:PGPASSWORD="your_password_from_railway"

# 2. Export with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway -F c -f "backup_$timestamp.dump"

# 3. Verify export was created
ls backup_*.dump
```

This will create a compressed backup file that you can restore later or use for migration.


