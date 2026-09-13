# Production / RapidAPI readiness

## Persistent state

For a single-process local development environment, the API can continue using in-memory state.
For production, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Redis is used only for operational state:

- monthly API-key usage counters;
- distributed per-window request limits.

CNPJ, CEP and company records are not stored in Redis by this feature.

## API key rotation

API keys remain environment-managed in this MVP. To rotate a compromised key:

1. Generate a new random key.
2. Add the new key to `API_KEYS_FREE` or `API_KEYS_PAID`.
3. Add the old key to `API_KEYS_REVOKED`.
4. Deploy/restart the API.
5. Remove the old key from the active list after verifying the new key.

Never commit API keys to Git.

## Monitoring

Use `/health` as the uptime check. When Redis is configured, `/health` reports it as a dependency and returns HTTP 503 if Redis is unavailable.

Recommended initial alerts:

- health check failing for 2 consecutive intervals;
- HTTP 5xx rate above 2% for 5 minutes;
- HTTP 429 rate above 5% for 5 minutes;
- provider error/timeout rate above 5% for 5 minutes;
- Redis unavailable for 2 consecutive health checks.

The authenticated `/api/v1/metrics` endpoint exposes request counts, error counts, latency, cache statistics and CNPJ provider statistics.

## Smoke tests

The opt-in `tests/e2e/production-smoke.test.ts` suite runs against a real deployment when these environment variables are supplied:

```text
E2E_BASE_URL=https://your-api.example.com
E2E_API_KEY=...
E2E_CEP=...
E2E_CNPJ=...
```

It is intentionally skipped in normal CI so production credentials are never required in the repository.

Before publishing on RapidAPI, manually verify the deployed version through Swagger and confirm these headers on authenticated responses:

- `X-Request-Id`
- `X-Plan`
- `X-Usage-Limit`
- `X-Usage-Used`
- `X-Usage-Remaining`
- `X-Usage-Reset`
- `X-Provider` on successful CNPJ responses

## RapidAPI beta checklist

- [ ] Render deployment is healthy.
- [ ] Redis production variables are configured.
- [ ] Exposed test/old API keys are revoked and rotated.
- [ ] Swagger smoke tests pass on the deployed commit.
- [ ] `/health` returns 200 and Redis is `ok`.
- [ ] `/api/v1/metrics` is protected by API key.
- [ ] RapidAPI points to the production base URL.
- [ ] Free plan quota and rate limit match the public product description.
