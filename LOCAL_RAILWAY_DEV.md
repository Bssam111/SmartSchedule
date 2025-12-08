# Local Dev Against Railway Postgres

Use this runbook to run the SmartSchedule backend + frontend locally while keeping the canonical Railway Postgres database as the single source of truth. This is useful when you want to iterate on code/UI without redeploying but still hit live data.

---

## 1. Prerequisites

- Node.js 20.x and npm 10.x installed locally.
- Ports `3000` (Next.js) and `3001` (Express API) are free.
- Railway Postgres TCP proxy credentials (see the `Railway → Postgres → Variables` panel).\
  _Current values shared in this ticket:_\
  `PGHOST=yamanote.proxy.rlwy.net`\
  `PGPORT=16811`\
  `PGDATABASE=railway`\
  `PGUSER=postgres`\
  `PGPASSWORD=<provided-secret>`

⚠️ **Treat the password as a secret. Do not commit it to git or share outside the team.**

---

## 2. Configure environment variables

### Backend

1. Copy `backend/env.railway.local.example` to `backend/.env`.
2. Replace `<RAILWAY_DB_PASSWORD>` with the actual `PGPASSWORD` from Railway.
3. (Optional) Override `JWT_SECRET` with a long random string:
   ```powershell
   cd backend
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
4. If you plan to run Prisma migrations, uncomment `SHADOW_DATABASE_URL` and point it to a disposable database (never reuse `railway` for the shadow database).

The resulting `backend/.env` should resemble:

```
DATABASE_URL="postgresql://postgres:***@yamanote.proxy.rlwy.net:16811/railway?schema=public&sslmode=require&pgbouncer=true&connect_timeout=15"
PORT=3001
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="..."
```

### Frontend

1. Copy `smart-schedule/env.local.example` to `smart-schedule/.env.local`.
2. Leave the defaults (`http://localhost:3001`) unless you proxy the API differently.

---

## 3. Verify database connectivity

From `backend/`:

```bash
npm install
npx prisma db pull   # confirms credentials + SSL settings are valid
npm run db:generate  # regenerates the Prisma client locally
```

If you see TLS errors, ensure `sslmode=require` is still present in `DATABASE_URL`.\
If you see `too many connections`, keep `pgbouncer=true` and restart the backend to release idle clients.

---

## 4. Run the stack locally

### Backend API

```bash
cd backend
npm run dev
```

- API: http://localhost:3001/api
- Health check: http://localhost:3001/api/health
- Logs include Prisma connection status so you can confirm the live DB is in use.

### Frontend (Next.js)

```bash
cd smart-schedule
npm install
npm run dev
```

- App: http://localhost:3000
- The Next.js app proxies API calls to `http://localhost:3001/api`, so it will display live data served by the local API hitting Railway.

---

## 5. Safe change workflow

1. **Pull latest code** – `git pull origin main`.
2. **Start backend** – ensures API is reading/writing to Railway immediately.
3. **Iterate on code** – changes are hot-reloaded locally.
4. **Test flows** – use the local frontend to exercise the same DB as production.
5. **Commit + push** – once satisfied, push normally; no Railway deploy required just to test code.

---

## 6. Running migrations carefully

Because you are connected to the live Railway database:

- Prefer `npx prisma migrate deploy` only after migrations are merged and reviewed.
- For local schema exploration, use `npx prisma db pull` instead of `migrate dev`.
- If you must create migrations locally, point `SHADOW_DATABASE_URL` to a temporary Railway database or a local Postgres instance to avoid clobbering production data.
- Keep database backups (`railway snapshot`) before applying irreversible changes.

---

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `ECONNREFUSED yamanote.proxy.rlwy.net:16811` | Start the Railway Postgres service or verify the TCP proxy is enabled. |
| `certificate verify failed` | Ensure `sslmode=require` is in `DATABASE_URL`. Railway uses trusted certs so no custom CA is needed. |
| `FATAL: remaining connection slots are reserved` | Stop extra local servers, keep `pgbouncer=true`, and run `SELECT pid, application_name FROM pg_stat_activity;` from pgAdmin to kill idle sessions. |
| Requests take 2–3s locally | Expect extra latency when tunneling to Railway; prefer running read-heavy scripts off-hours. |

---

## 8. Useful commands

```bash
# Tail Prisma queries while the backend runs
LOG_LEVEL=debug npm run dev

# Manual DB check without Prisma
PGPASSWORD="<secret>" psql -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway -c "select now();"

# Export current production data
PGPASSWORD="<secret>" pg_dump -h yamanote.proxy.rlwy.net -p 16811 -U postgres -d railway --data-only -F p > railway-data.sql
```

---

You now have a reproducible workflow to run both services locally while sharing the live Railway Postgres database. Adjust secrets and ports as needed, and keep production data safeguards in mind when running migrations or destructive scripts.

