# myshowcasespace MVP

Self-serve SaaS MVP where artists can sign up, create a tenant, manage pieces, style their site, preview, publish, and upgrade.

## Stack

- Runtime: Node.js + TypeScript
- API: Fastify
- DB/ORM: PostgreSQL (Neon) + Prisma
- Frontend: React + Vite + TypeScript
- Auth: Email/password + DB-backed session cookies
- Validation: Zod
- Tests: Vitest + Fastify inject

## Features Implemented

- Auth:
  - Signup/login/logout/me
  - Password hashing with bcrypt
  - Session auth via signed HttpOnly cookie + `Session` table
- Frontend app:
  - Marketing home page
  - Login/signup pages
  - Authenticated onboarding workspace with step flow:
    - Brand profile
    - Publish + plan upgrade
    - Admin handoff to `.../admin` for later piece management
- Tenant onboarding:
  - Create tenant with brand profile and theme basics
  - Auto-generate tenant code and tenant API key
- CMS for pieces:
  - CRUD + publish/unpublish for pieces
  - Free plan hard limit: 3 pieces
- Publishing:
  - Publish/unpublish tenant site
  - Generate and persist subdomain: `{tenantSlug}.myshowcase.space`
- Plans + billing-ready flow:
  - Plan model (`free`, `pro`)
  - Upgrade flow with real checkout-session persistence (Stripe placeholder provider refs)
  - Complete checkout endpoint updates tenant plan + billing account status
  - Pro-only custom domain endpoint
- Tenant-scoped API:
  - API-key + tenant-code authenticated public data endpoint for spawned showcase sites
- DX:
  - Prisma schema + migration
  - Seed script
  - `.env.example`
  - Tests for auth and free-plan piece limit

## Quick Start

1. Install dependencies:

```bash
npm install
npm --prefix frontend install
```

2. Configure env:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your Neon Postgres connection string.

3. Generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:deploy
```

4. Seed demo data:

```bash
npm run seed
```

5. Run API:

```bash
npm run dev
```

6. Run frontend (new terminal):

```bash
npm run dev:web
```

- API runs on `http://localhost:3000`
- Frontend runs on `http://localhost:5173`

## Vercel Deployment

This repo can be deployed as a single Vercel project:

- The frontend is built from `frontend/` and served as the primary site.
- The backend runs as a Vercel Node function from `api/[...path].ts`.
- Frontend requests should keep using `/api`, which Vercel maps into the existing Fastify routes.

Required Vercel environment variables:

- `DATABASE_URL`
- `SESSION_TTL_HOURS`
- `PLATFORM_DOMAIN`
- `PLATFORM_PROTOCOL`
- `COOKIE_NAME`
- `UPLOADTHING_TOKEN`
- `HCAPTCHA_SITE_KEY`
- `HCAPTCHA_SECRET_KEY`

Recommended setup notes:

- Keep `NODE_ENV=production` in Vercel so auth cookies are marked `secure`.
- hCaptcha should be disabled on `localhost` during local development. Use a real host alias such as `test.mydomain.com` if you want to exercise hCaptcha locally.
- The frontend loads the public hCaptcha site key from the backend at runtime, so only the server-side `HCAPTCHA_SITE_KEY` and `HCAPTCHA_SECRET_KEY` need to be configured.
- Run `npm run prisma:deploy` against your Vercel database before or during production rollout.
- Use a separate preview database if you enable preview deployments.
- Do not rely on the local `uploads/` directory on Vercel. Runtime storage is ephemeral, so production uploads should go through UploadThing.

## Scripts

- `npm run dev` - start dev server
- `npm run dev:api` - start API dev server
- `npm run dev:web` - start frontend dev server
- `npm run build:vercel` - build the frontend artifact used by Vercel
- `npm run build` - compile TypeScript to `dist/`
- `npm run build:web` - build frontend
- `npm run build:all` - build backend + frontend
- `npm run start` - run compiled server
- `npm run test` - run tests
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:deploy` - apply checked-in migrations
- `npm run prisma:migrate -- --name <migration_name>` - create/apply new migration (dev)
- `npm run seed` - seed sample plans/user/tenant/pieces

## Seed Data

After `npm run seed`:

- Demo login: `demo@myshowcase.space` / `Password123!`
- Demo tenant code: `DEMOART123`
- Demo tenant API key: `mssk_demo_seed_api_key_123456`

## API Routes

### Health

- `GET /health`

### Auth

- `GET /auth/config`
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Tenants

- `POST /tenants` - create tenant + initial API key
- `GET /tenants` - list current user tenants
- `GET /tenants/:tenantId`
- `PATCH /tenants/:tenantId`
- `POST /tenants/:tenantId/publish`
- `POST /tenants/:tenantId/unpublish`
- `POST /tenants/:tenantId/api-keys/rotate`
- `POST /tenants/:tenantId/billing/checkout-sessions`
- `POST /tenants/:tenantId/billing/checkout-sessions/:sessionId/complete`
- `PUT /tenants/:tenantId/domains/custom`

### Pieces CMS

- `GET /tenants/:tenantId/pieces`
- `POST /tenants/:tenantId/pieces`
- `GET /tenants/:tenantId/pieces/:pieceId`
- `PATCH /tenants/:tenantId/pieces/:pieceId`
- `DELETE /tenants/:tenantId/pieces/:pieceId`
- `POST /tenants/:tenantId/pieces/:pieceId/publish`
- `POST /tenants/:tenantId/pieces/:pieceId/unpublish`

### Tenant API (for showcase frontends)

- `GET /tenant-api/v1/:tenantCode/site`
  - Requires header: `x-tenant-api-key: <raw-api-key>`

### Public read endpoint

- `GET /public/sites/:slug`

## Frontend Routes

- `/` - marketing home
- `/login` - user login
- `/signup` - user signup
- `/app` - authenticated onboarding/dashboard flow (brand + publish + upgrade)

## Core Data Model

Tables:

- `User`
- `Session`
- `Plan`
- `Tenant`
- `Piece`
- `Domain`
- `ApiKey`
- `BillingAccount`
- `BillingCheckoutSession`

Notes:

- `Plan.pieceLimit = 3` for `free`, `null` (unlimited) for `pro`
- Tenant stores generated `tenantCode` and publication status/url
- API keys are hashed (`keyHash`) at rest; raw key is shown only on creation/rotation response
- Piece limit enforced at create-time for free tenants

## Testing

Implemented tests:

- `tests/auth.test.ts` - signup/session/me/logout flow
- `tests/pieces-limit.test.ts` - free-plan piece limit enforcement

Run with:

```bash
npm test
```

Notes:
- Tests require `DATABASE_URL` (or `TEST_DATABASE_URL`) to point to a reachable Postgres database.
- Test runs isolate data by creating a unique schema per test process.

## Production TODO (Important)

- Add CSRF protections and stricter cookie settings per deployment topology
- Add rate limiting, bot protection, and brute-force defenses
- Add email verification + password reset flows
- Add RBAC/multi-user tenant membership model
- Add Stripe real checkout + webhook signature verification
- Add domain ownership verification (DNS/HTTP challenge)
- Add robust audit logs and admin observability
- Add OpenAPI docs and request-id tracing
- Add background jobs for async publishing/domain checks
- Add integration/e2e tests and CI pipeline gates
