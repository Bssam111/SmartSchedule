# SmartSchedule

Modern scheduling platform with a TypeScript/Express backend and a Next.js 15 frontend. This repo contains everything needed for local development or running the stack via Docker so collaborators can get started quickly.

## Project layout

```
SmartSchedule/
├── backend/          # Express + Prisma API
├── smart-schedule/   # Next.js frontend
├── docker-compose.dev.yml
└── README.md
```

## Prerequisites

| Tool | Version (min) | Notes |
| --- | --- | --- |
| Node.js | 20.x LTS | Required for both backend & frontend |
| npm | 10.x | Bundled with Node 20 |
| Docker + Compose | Latest | Optional, for container workflow |
| PostgreSQL | 15+ | Needed if not using Docker |

## Environment variables

Create the following files (keep secrets out of git):

- `backend/.env`
- `smart-schedule/.env.local`

Minimum variables:

```bash
# backend/.env
DATABASE_URL="postgresql://smartschedule:dev_password@localhost:5432/smartschedule_dev?schema=public"
JWT_SECRET="replace-me"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
FRONTEND_URL="http://localhost:3000"
```

```bash
# smart-schedule/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_EXTERNAL_API_URL="http://localhost:3001"
```

Add any additional secrets as needed (Redis, analytics providers, etc.).

## Local development (manual)

1. **Install dependencies**
   ```bash
   cd backend && npm install
   cd ../smart-schedule && npm install
   ```
2. **Database**
   - Start PostgreSQL (Docker or local service).
   - Run migrations from `backend`:
     ```bash
     npm run db:migrate
     npm run db:seed        # optional sample data
     ```
3. **Start backend**
   ```bash
   cd backend
   npm run dev
   ```
4. **Start frontend**
   ```bash
   cd smart-schedule
   npm run dev
   ```
5. Visit `http://localhost:3000` (frontend) and `http://localhost:3001/api/health` (API).

## Docker workflow

1. Ensure Docker Desktop is running.
2. From repo root:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```
3. Containers:
   - `database` → PostgreSQL (port 5432)
   - `backend-dev` → API (port 3001)
   - `frontend-dev` → Next.js (port 3000)
4. Stop with `docker compose -f docker-compose.dev.yml down`.

## Quality checks

### Backend
```bash
cd backend
npm run lint
npm run test
npm run typecheck
```

### Frontend
```bash
cd smart-schedule
npm run lint
npm run test
npm run typecheck
```

## Troubleshooting

- **Database connection errors**: confirm `DATABASE_URL` matches running instance and credentials.
- **Port conflicts**: change `PORT` in `backend/.env` or adjust Docker `ports` mappings.
- **Prisma schema drift**: rerun `npm run db:generate` or `npm run db:push` inside `backend`.
- **Missing dependencies**: rerun `npm install` or delete `node_modules` and reinstall.

---

With dependencies installed and environments configured, teammates can run both services locally or via Docker using the commands above.

