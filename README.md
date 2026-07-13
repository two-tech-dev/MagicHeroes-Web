# MagicHeroes Web Dashboard

React + TypeScript + Vite dashboard for MagicHeroes administrators. Current release is an MVP using mock API data only; it does not include a backend.

## Requirements

- Node.js 20+
- npm 10+

## Run

```bash
npm install
npm run dev:api
npm run dev
```

API defaults to `http://localhost:8787`. For local plugin sync:

```yaml
web:
  enabled: true
  url: "http://127.0.0.1:8787/api/v1"
  server-id: "server-01"
  api-token: "token-generated-by-POST-/api/v1/servers"
```

Production must use HTTPS. The local HTTP endpoint exists only for development.

Build and typecheck:

```bash
npm run build
npm run typecheck
```

## Environment

Copy `.env.example` to `.env.local`.

```env
VITE_API_BASE_URL=https://your-domain.com/api/v1
VITE_USE_MOCK_API=true
VITE_DEFAULT_LOCALE=vi
VITE_APP_NAME=MagicHeroes
```

Do not commit real `.env.local` files, API tokens, passwords, or production URLs with credentials.

## Mock mode

`VITE_USE_MOCK_API=true` is current MVP mode. Mock records live in `src/mocks/data.ts`; UI accesses them only through `src/api/dashboardApi.ts`. Replace services in `src/api/` when backend API is ready. Do not put mock records inside React components.

## Register local server

1. Start API with Google OAuth configured.
2. Open dashboard and click `Tiếp tục với Google`.
3. Open `Cài đặt` → `API tokens` → create token.
4. Copy token once into plugin `config.yml`.
5. API stores only SHA-256 token hash in `data/store.json`.

Each Google account owns its own server records and API tokens. Token revoke immediately blocks plugin sync.

For real API mode set `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL=http://localhost:8787/api/v1`. Login uses Google OAuth; do not put Google client secret in Vite environment. Configure OAuth only on API server:

```powershell
$env:GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"
$env:API_URL="http://localhost:8787"
$env:FRONTEND_URL="http://localhost:5173"
npm run dev:api
```

Google Cloud OAuth redirect URI:

```text
http://localhost:8787/api/v1/auth/google/callback
```

Production uses HTTPS redirect URI, HttpOnly secure session cookie, OAuth state validation, verified Google email, and account-owned API tokens. Never put Google client secret, API admin token, or plugin token in frontend code.

## Backend contract

Web changes must create commands in backend queue. Plugin polls or receives commands, validates them on Minecraft main thread, applies mutation, saves profile asynchronously, then posts command result. Frontend must never write player YAML/database directly.

Expected endpoint groups:

- `/auth`
- `/servers`
- `/players`
- `/quests`
- `/items`
- `/skills`
- `/commands`
- `/audit-logs`

Server registration API generates `server-id` and `api-token`. Show token once only. Plugin config stores its token and only connects through HTTPS.

## Structure

- `src/api`: typed HTTP boundary and resource services
- `src/components`: shared layout/UI
- `src/hooks`: UI data hooks
- `src/mocks`: isolated mock data
- `src/types`: API/domain types
- `src/pages.tsx`: MVP route pages

## Deployment

Run `npm run build`, deploy `dist/` behind HTTPS. Configure backend CORS narrowly to dashboard origin. Use HttpOnly secure session cookies for production login, not passwords or long-lived session tokens in localStorage.
"# MagicHeroes-Web" 
