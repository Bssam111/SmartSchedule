# Architecture

- Monorepo: web (Next.js), api (Express), db (Postgres via Docker)
- Validation: Zod; ORM: Prisma; Tests: Jest/Vitest + Supertest
- Modules: auth, imports, rules, preferences, schedules, feedback, notify
