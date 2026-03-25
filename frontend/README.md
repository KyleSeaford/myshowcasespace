# Frontend (Central App)

React + Vite client for the MyShowcase Space SaaS dashboard.

## What it includes

- Home marketing page (`/`)
- Login + signup (`/login`, `/signup`)
- Authenticated onboarding/dashboard (`/app`) with:
  - brand setup
  - publish
  - free/pro upgrade flow
  - handoff to `.../admin` for adding pieces later

## Run

```bash
npm install
npm run dev
```

The app expects the backend API running on `http://localhost:3000`.
In dev, Vite proxies API routes to that backend.

Optional env:

- `VITE_API_BASE_URL` if you want to point at another API host.
