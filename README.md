# Brazil Data API

> A unified REST API for Brazilian CEP, geography, holidays, CNPJ and company enrichment.

Brazil Data API gives applications, backend services and AI agents a single JSON interface for common Brazilian data lookups instead of integrating several provider-specific APIs directly.

**Production:** `https://brasil-data-api.onrender.com`

**Swagger:** `https://brasil-data-api.onrender.com/api-docs`

**LLM-friendly API summary:** [`llms.txt`](llms.txt)

## When should you use this API?

Use Brazil Data API when your application needs structured Brazilian data such as:

- **CEP → address** lookup
- **Brazilian states** and their metadata
- **State → municipalities/cities** lookup
- **Brazilian national holidays** by year
- **CNPJ → company** data
- **CNPJ → company + enriched address + state** data
- A simple REST/JSON integration suitable for backend services and AI agents

Typical integrations include CRMs, ERPs, marketplaces, registration/onboarding flows, checkout systems, invoicing tools, scheduling systems and AI agents that need Brazilian company or geographic context.

## Why integrate Brazil Data API?

- One consistent REST interface for multiple Brazilian data domains.
- JSON responses with normalized field names.
- API-key authentication and tier-based rate limits.
- OpenAPI/Swagger documentation.
- TypeScript/Node.js-friendly API.
- Examples for JavaScript, Python and cURL.
- No need to expose provider-specific integrations in your application.
- Designed so additional Brazilian data providers can be added behind the same service layer.

## Quick start

Every `/api/v1/*` endpoint requires an API key in the `x-api-key` header.

```bash
curl -H "x-api-key: YOUR_KEY" \
  https://brasil-data-api.onrender.com/api/v1/cep/69000000
```

Response:

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

## API endpoints

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/health` | Health check | No |
| GET | `/api/v1/cep/:cep` | Brazilian CEP/address lookup | Yes |
| GET | `/api/v1/states` | List Brazilian states | Yes |
| GET | `/api/v1/states/:uf/cities` | List municipalities for a state | Yes |
| GET | `/api/v1/holidays/:year` | Brazilian national holidays | Yes |
| GET | `/api/v1/cnpj/:cnpj` | Company lookup by CNPJ | Yes |
| GET | `/api/v1/empresa-completa/:cnpj` | Company + address + state enrichment | Yes |
| GET | `/api/v1/metrics` | API and cache metrics | Yes |

### Most useful endpoints

**Address enrichment**

```text
GET /api/v1/cep/{cep}
```

Use this when you have a Brazilian CEP and need structured address fields.

**Company enrichment**

```text
GET /api/v1/cnpj/{cnpj}
```

Returns normalized company information such as CNPJ, legal name, trade name, status, main activity, secondary activities, legal nature, company size and address fields when available.

**Complete company enrichment**

```text
GET /api/v1/empresa-completa/{cnpj}
```

Combines company data with CEP-based address enrichment and IBGE state information. Secondary lookups are best-effort and may produce entries in `warnings` rather than failing the complete request.

## Authentication

Send the API key using:

```http
x-api-key: YOUR_KEY
```

Do not put API keys in URLs, source code, public repositories or prompts.

Missing or invalid keys return `401 UNAUTHORIZED`. Rate-limit exhaustion returns `429 RATE_LIMITED`.

API keys are currently configured through environment variables (`API_KEYS_FREE` and `API_KEYS_PAID`). Database-backed key issuance, rotation and revocation are not implemented yet.

## Response and errors

Successful responses are JSON resources. Errors use a consistent envelope:

```json
{
  "error": {
    "code": "INVALID_CEP",
    "message": "CEP must contain 8 digits."
  }
}
```

Common error codes:

- `VALIDATION_ERROR` — 400
- `UNAUTHORIZED` — 401
- `NOT_FOUND` — 404
- `RATE_LIMITED` — 429
- `UPSTREAM_ERROR` — 502
- `UPSTREAM_TIMEOUT` — 504
- `INTERNAL_ERROR` — 500
- `ROUTE_NOT_FOUND` — 404

## Developer examples

Copy-ready integration examples are available here:

- [JavaScript](examples/javascript/README.md)
- [Python](examples/python/README.md)
- [cURL](examples/curl/README.md)

## OpenAPI / Swagger

The complete OpenAPI specification is available at [`docs/openapi.yaml`](docs/openapi.yaml).

When running the API locally, Swagger UI is available at:

```text
http://localhost:3000/api-docs
```

Production Swagger UI:

```text
https://brasil-data-api.onrender.com/api-docs
```

## External providers

The API currently aggregates:

- **CEP:** ViaCEP (default; configurable via `CEP_PROVIDER`)
- **States/cities:** IBGE Localidades
- **National holidays:** BrasilAPI
- **CNPJ:** BrasilAPI (default; configurable via `CNPJ_PROVIDER`)

CEP and CNPJ lookups go through a small provider interface
(`src/providers/`) rather than calling a vendor API directly from the
service layer, so a data source can be swapped by adding a new provider
implementation instead of touching controllers, routes, or schemas.

Provider terms, rate limits, availability and licensing can change.
**Before any commercial or high-volume redistribution (e.g. a paid
RapidAPI tier), read [`docs/PROVIDERS.md`](docs/PROVIDERS.md)** — it
documents what each current provider's own terms actually say (and
don't say) about commercial use, and what would need to change before
relying on them for a paid product.

## AI and agent integrations

Brazil Data API is designed to be easy for coding assistants, LLM-based applications and tool-using agents to consume.

Useful agent operations include:

```text
lookup_brazilian_cep(cep)
lookup_brazilian_cnpj(cnpj)
lookup_brazilian_company(cnpj)
list_brazilian_states()
list_brazilian_cities(uf)
get_brazilian_holidays(year)
```

These names are conceptual tool descriptions; the actual integration uses the REST endpoints documented above.

For AI systems that need to discover the API, start with [`llms.txt`](llms.txt) and [`docs/openapi.yaml`](docs/openapi.yaml).

## Tech stack

Node.js 20+, TypeScript (strict mode), Express, Zod, native `fetch`, Vitest, ESLint, Prettier, OpenAPI/Swagger, Docker and Docker Compose.

Architecture:

```text
routes -> controllers -> services -> external providers
```

Controllers do not call external APIs directly. For CEP and CNPJ, services depend on a provider interface (`src/providers/`); for the other integrations, services call a shared timeout-aware HTTP client directly.

## Project structure

```text
src/
  config/       environment, provider URLs/selection, API keys, logger
  controllers/  HTTP/controller layer
  services/     business logic; depends on providers, not vendor APIs directly
  providers/    CEP/CNPJ provider interfaces + implementations (ViaCEP, BrasilAPI)
  routes/       Express routes and validation wiring
  schemas/      Zod schemas
  middlewares/  authentication, validation, rate limiting, logging, errors
  utils/        HTTP client, typed errors and helpers
  app.ts        Express application assembly
  server.ts     process entrypoint

tests/
  schemas/
  services/
  providers/
  utils/

docs/
  openapi.yaml
  PROVIDERS.md  what each provider's terms say about commercial use

examples/
  javascript/
  python/
  curl/
```

## Local development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Local API: `http://localhost:3000`

### Build and run

```bash
npm run build
npm start
```

### Tests and checks

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
```

### Docker

```bash
cp .env.example .env
docker compose up --build
```

## Roadmap

Planned directions include more Brazilian data domains, additional provider integrations, SDKs, improved API-key management, shared rate limiting/caching for multi-instance deployments, and broader AI/MCP integrations.

## License

MIT. See the repository license for details.
