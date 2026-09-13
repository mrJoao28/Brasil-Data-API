# Brazil Data API

A unified REST API that aggregates Brazilian public/free data sources
(postal codes, geographic data, national holidays, and CNPJ company
lookups) behind a single, consistent JSON interface — built as an MVP
intended for eventual publication and monetization on RapidAPI.

```
routes -> controllers -> services -> external providers
```

Controllers never call external APIs directly; only the `services/` layer
talks to the outside world, through a shared `fetchJson` HTTP client that
enforces timeouts and consistent error handling.

## Tech stack

Node.js, TypeScript (strict mode), Express, Zod, native `fetch`, Vitest,
ESLint, Prettier, OpenAPI/Swagger, Docker & Docker Compose. No database,
no Redis — intentionally, for this MVP stage. `/api/v1/*` requires an API
key (see [Authentication & tiers](#authentication--tiers) below).

## Endpoints

| Method | Path                         | Description                              | Auth required |
| ------ | ---------------------------- | ----------------------------------------- | -------------- |
| GET    | `/health`                    | Liveness/health check                     | No             |
| GET    | `/api/v1/cep/:cep`           | Address lookup by postal code (CEP)       | Yes            |
| GET    | `/api/v1/states`             | List all Brazilian states                 | Yes            |
| GET    | `/api/v1/states/:uf/cities`  | List cities (municipalities) for a state  | Yes            |
| GET    | `/api/v1/holidays/:year`     | National holidays for a given year        | Yes            |
| GET    | `/api/v1/cnpj/:cnpj`         | Company lookup by CNPJ                    | Yes            |

Interactive API documentation (Swagger UI) is served at `/api-docs` once
the server is running, generated from [`docs/openapi.yaml`](docs/openapi.yaml).

## Authentication & tiers

Every `/api/v1/*` request must include an API key in the `x-api-key`
header:

```bash
curl -H "x-api-key: YOUR_KEY" http://localhost:3000/api/v1/states
```

- Missing or unknown key → `401 UNAUTHORIZED`.
- Each key belongs to a tier — `free` or `paid` — which sets its own
  request ceiling per `RATE_LIMIT_WINDOW_MS` window (`RATE_LIMIT_FREE_MAX` /
  `RATE_LIMIT_PAID_MAX` in `.env`). Exceeding it returns
  `429 RATE_LIMITED`. The limit is tracked per API key, not per IP, so
  different keys never share a bucket.
- Keys are configured via the `API_KEYS_FREE` / `API_KEYS_PAID`
  comma-separated environment variables (see `.env.example`) — there is no
  database yet in this MVP. `src/config/apiKeys.ts` is the single place
  that resolves a key to a tier, so swapping this for a real key-management
  database later doesn't require touching the auth middleware or routes.
- `/health` and `/api-docs` do not require a key; they still count against
  the baseline `RATE_LIMIT_MAX_REQUESTS` limiter applied to all traffic.

### Response format

All successful responses return the resource as plain JSON, e.g.:

```json
{
  "cep": "69000000",
  "street": "...",
  "neighborhood": "...",
  "city": "Manaus",
  "state": "Amazonas",
  "stateCode": "AM"
}
```

All errors share a consistent envelope with an appropriate HTTP status
code:

```json
{
  "error": {
    "code": "INVALID_CEP",
    "message": "CEP must contain 8 digits."
  }
}
```

Common error codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401),
`NOT_FOUND` (404), `RATE_LIMITED` (429), `UPSTREAM_ERROR` (502),
`UPSTREAM_TIMEOUT` (504), `INTERNAL_ERROR` (500), `ROUTE_NOT_FOUND` (404).

## External providers

Base URLs for every provider are configurable via environment variables
(see `.env.example`) so they can be swapped without code changes.

| Data          | Provider                | Base URL (default)                                         | Auth  | Notes |
| ------------- | ------------------------ | ----------------------------------------------------------- | ----- | ----- |
| CEP           | [ViaCEP](https://viacep.com.br/) | `https://viacep.com.br/ws` | None | Free, no key. Returns HTTP 200 with `{"erro": true}` for a well-formed but non-existent CEP; the service maps this to a `404 NOT_FOUND`. |
| States/cities | [IBGE Localidades](https://servicodados.ibge.gov.br/api/docs/localidades) | `https://servicodados.ibge.gov.br/api/v1/localidades` | None | Official Brazilian government (IBGE) source. Public domain government data. |
| Holidays      | [BrasilAPI](https://brasilapi.com.br/) `/feriados/v1/{year}` | `https://brasilapi.com.br/api` | None | Open-source, community-run aggregator (MIT-licensed on GitHub). Computes fixed and moving (Carnaval, Páscoa) national holidays. |
| CNPJ          | [BrasilAPI](https://brasilapi.com.br/) `/cnpj/v1/{cnpj}` | `https://brasilapi.com.br/api` | None | Aggregates official Receita Federal data via the open-source "Minha Receita" project. Free and redistributable, but **before using this commercially at scale, re-verify BrasilAPI's current terms of use and rate limits** — free public infrastructure can change its policies, and this MVP does not assume indefinite unlimited redistribution rights. |

Why these choices:

- **ViaCEP** and **IBGE** were specified directly in the project
  requirements and are the de-facto standard free/official sources for
  CEP and geographic data in Brazil.
- **BrasilAPI** was chosen for holidays and CNPJ because it is a free,
  open-source, widely used aggregator with no API key requirement and
  clearly documented endpoints, and because it sources CNPJ data from
  the Receita Federal (via Minha Receita) rather than scraping
  arbitrary third-party sites. It was evaluated instead of scraping any
  unofficial source, in line with the project's requirement to validate
  legal/public data sources before implementing CNPJ.
- No provider here requires an API key in the MVP. If a future provider
  needs one, add it to `.env.example` and read it through
  `src/config/env.ts` — never hard-code credentials.

**Before deploying to production or RapidAPI**, re-check each
provider's current terms of service, rate limits, and uptime — free
public APIs can change availability or licensing at any time, and this
README reflects research done at the time this MVP was built.

## Project structure

```
src/
  config/       env parsing (Zod), provider base URLs, API keys/tiers, logger
  controllers/  thin HTTP layer — parse request, call service, send response
  services/     business logic + calls to external providers
  routes/       Express route definitions + validation wiring
  schemas/      Zod schemas for request validation and provider payloads
  middlewares/  error handler, request validation, API key auth, rate limiting, logging
  utils/        HTTP client (timeout-aware fetch), typed errors, helpers
  app.ts        Express app assembly
  server.ts     process entrypoint (listen, graceful shutdown)
tests/
  schemas/      unit tests for Zod schemas
  services/     unit tests for services (external calls mocked)
docs/
  openapi.yaml  OpenAPI 3.0 spec served at /api-docs
```

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cp .env.example .env
npm install
```

### Development

```bash
npm run dev
```

Starts the server with hot reload at `http://localhost:3000`. Swagger UI
is available at `http://localhost:3000/api-docs`.

### Build & run (production mode, without Docker)

```bash
npm run build
npm start
```

### Linting & formatting

```bash
npm run lint          # check
npm run lint:fix      # auto-fix
npm run format        # write formatting
npm run format:check  # check only
npm run typecheck     # tsc --noEmit
```

### Testing

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

Unit tests cover:

- **Schemas**: valid/invalid input for CEP, UF, year, and CNPJ
  validation, including sanitization (e.g. stripping hyphens/dots).
- **Services**: mapping of each provider's raw payload into the API's
  consistent response shape, and error handling (not-found, malformed
  payloads), with `fetch` mocked — no real network calls are made in
  tests.

## Docker

### Build & run with Docker Compose (recommended for local use)

```bash
cp .env.example .env
docker compose up --build
```

The API will be available at `http://localhost:3000` (configurable via
`PORT` in `.env`).

### Build & run with plain Docker

```bash
docker build -t brazil-data-api .
docker run --rm -p 3000:3000 --env-file .env brazil-data-api
```

The image is a multi-stage build (compile with dev dependencies, then a
slim `node:20-alpine` production image running as a non-root user) with
a built-in `HEALTHCHECK` hitting `/health`.

## Configuration reference

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable                   | Default                                              | Description                                    |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| `PORT`                      | `3000`                                                | HTTP port                                       |
| `NODE_ENV`                  | `development`                                         | `development` \| `production` \| `test`         |
| `LOG_LEVEL`                 | `info`                                                | Pino log level                                  |
| `CORS_ORIGIN`               | `*`                                                    | `*` or comma-separated list of allowed origins  |
| `RATE_LIMIT_WINDOW_MS`      | `60000`                                               | Rate limit window (baseline and per-tier)       |
| `RATE_LIMIT_MAX_REQUESTS`   | `60`                                                   | Baseline max requests per window (all routes)   |
| `RATE_LIMIT_FREE_MAX`       | `60`                                                   | Max `/api/v1` requests per window, `free` tier  |
| `RATE_LIMIT_PAID_MAX`       | `1000`                                                 | Max `/api/v1` requests per window, `paid` tier  |
| `API_KEYS_FREE`             | *(empty)*                                              | Comma-separated `free`-tier API keys            |
| `API_KEYS_PAID`             | *(empty)*                                              | Comma-separated `paid`-tier API keys            |
| `HTTP_TIMEOUT_MS`           | `8000`                                                | Timeout for calls to external providers         |
| `VIACEP_BASE_URL`           | `https://viacep.com.br/ws`                            | ViaCEP base URL                                 |
| `IBGE_LOCALIDADES_BASE_URL` | `https://servicodados.ibge.gov.br/api/v1/localidades` | IBGE Localidades base URL                       |
| `BRASILAPI_BASE_URL`        | `https://brasilapi.com.br/api`                        | BrasilAPI base URL (holidays + CNPJ)            |

## Design notes / what was intentionally left out of this MVP

- **No database, no Redis** — API keys/tiers are an in-memory lookup
  sourced from environment variables (`src/config/apiKeys.ts`); nothing
  else needs to be persisted yet.
- **API key auth is a thin MVP layer** — a request either matches a
  configured key (and gets that key's tier) or it doesn't; there's no
  key issuance, rotation, or revocation flow yet. This is meant to run
  behind (or alongside) RapidAPI's own key management, and to be swapped
  for a database-backed store later without touching the middleware or
  routes.
- **Rate limiting is in-memory** (via `express-rate-limit`), which is
  fine for a single instance but resets per-process and isn't shared
  across horizontally scaled replicas. Revisit with a shared store
  (e.g. Redis) only if/when the API is scaled out.
- **CNPJ** is implemented but should be re-validated against BrasilAPI's
  current terms before heavy production/commercial use, per the
  provider notes above.

## Roadmap ideas (not implemented)

- Response caching for slow-changing data (states, holidays).
- Additional providers (e.g. bank/DDD lookup, exchange rates) following
  the same `routes -> controllers -> services` pattern.
- Database-backed API key management (issuance, rotation, revocation).
