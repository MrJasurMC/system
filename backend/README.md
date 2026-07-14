# Fitness RPG — Backend API

A standalone **NestJS** backend implementing the Phase 7 Technical Architecture
document: REST + WebSocket API, PostgreSQL (via TypeORM), JWT auth with
rotating refresh tokens, rate limiting, and the core RPG/Quest/Workout/
Inventory/Achievement/Social modules from §5–§9.

## Relationship to the existing frontend

Your `fitness-rpg` React app currently talks to **Supabase** directly
(Postgres + RLS + RPC functions + Supabase Realtime). This server is a
**separate**, parallel backend — it does not read from or write to your
Supabase project, and the frontend does not call it yet.

To actually use this backend you'll need to point the frontend's data layer
(`src/services/supabase/*`) at these REST/WebSocket endpoints instead — that's
a real migration (swapping data-fetching code, auth flow, and realtime
subscriptions), not a drop-in. I scoped this session to standing up the
backend itself; ask if you'd like the frontend migration done next.

## Stack (§3)

Node.js 20, NestJS, TypeScript (strict), TypeORM, PostgreSQL, Redis,
Socket.io, Passport-JWT, bcrypt, class-validator, Helmet, Docker.

## Architecture mapping

| Doc section | Where it lives here |
|---|---|
| §5 Database Schema | `src/**/*.entity.ts` — one file per table |
| §6 REST + WebSocket | `src/**/*.controller.ts` + `src/realtime/events.gateway.ts` |
| §7 Auth (JWT + refresh + roles) | `src/auth/*` |
| §8 Security | `helmet`, global `ValidationPipe`, `ThrottlerModule`, bcrypt-hashed refresh tokens, `AllExceptionsFilter` |
| §9 System Modules | one Nest module per domain (`characters`, `quests`, `workouts`, `inventory`, `achievements`, `social`, `notifications`) |
| §10 Real-time | `EventsGateway` (Socket.io), room-per-user; add the Redis adapter (see below) before scaling past one instance |
| §13 Testing | `jest` + `*.spec.ts` (see `characters/leveling.spec.ts` for the pattern) |
| §14 CI/CD | `Dockerfile` + `docker-compose.yml`; wire a GitHub Actions workflow on top when you're ready to deploy |

## Getting started

```bash
cp .env.example .env        # fill in real secrets before anything but local dev
npm install
docker compose up -d postgres redis
npm run migration:run       # once you've generated a migration, see below
npm run start:dev
```

API is served under `/api` (e.g. `http://localhost:4000/api/auth/register`).
WebSocket connects to the same host; authenticate with
`{ auth: { token: <accessToken> } }` on the socket handshake.

### Generating the first migration

No migration is checked in yet — `synchronize` is enabled outside
`NODE_ENV=production` so local dev works immediately, but you should generate
a real migration before deploying:

```bash
npm run migration:generate -- src/database/migrations/InitSchema
npm run migration:run
```

## What's implemented vs. stubbed

**Implemented and working:**
- Register/login/refresh/logout with rotating, bcrypt-hashed refresh tokens in an httpOnly cookie
- Global auth guard (opt-out via `@Public()`), role guard (`@Roles()`)
- Character creation on signup, XP/level-up math (`characters/leveling.ts`, unit tested)
- Quests: accept → progress → auto-complete → claim → XP grant
- Workout session logging → XP grant
- Inventory: grant/use/equip
- Achievements: progress → unlock
- Friends: request/accept
- Notifications: persisted + pushed over the socket
- Leaderboard endpoint
- Global rate limiting + tighter limits on auth endpoints
- Helmet, CORS, input validation/whitelisting, centralized error handling

**Stubbed / left for you to wire up (§2 External Services):**
- S3/CloudFront asset upload (`.env.example` has the placeholders)
- Email service (verification, password reset)
- Push notifications
- Payment gateway
- Prometheus/Grafana/Sentry/ELK — hooks are there (health endpoint,
  centralized logging interceptor) but no exporters configured
- Redis is included in `docker-compose.yml` for the Socket.io Redis adapter
  and general caching, but nothing reads/writes it yet — add
  `@socket.io/redis-adapter` when you run more than one API instance

## Testing

```bash
npm test          # unit tests
npm run test:e2e  # once you add e2e specs under /test
```
