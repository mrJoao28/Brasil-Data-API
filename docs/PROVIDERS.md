# Providers

This project talks to external data sources (CEP, CNPJ, IBGE locations,
holidays) through a small **Provider** abstraction instead of calling
vendor APIs directly from controllers or services:

```
Controller → Service → Provider Interface → Concrete Provider (ViaCEP, BrasilAPI, ...)
```

- `src/providers/cepProvider.ts` / `src/providers/cnpjProvider.ts` — the
  interfaces. A provider takes a normalized CEP/CNPJ and returns data in
  this API's own consistent response shape, or `null` for "not found".
  Upstream failures are reported via the existing `UpstreamError` /
  `UpstreamTimeoutError` types, not vendor-specific errors.
- `src/providers/viaCepProvider.ts`, `src/providers/brasilApiCnpjProvider.ts`
  — the implementations actually in use today.
- `src/providers/cepProviderRegistry.ts`, `src/providers/cnpjProviderRegistry.ts`
  — pick the active provider from the `CEP_PROVIDER` / `CNPJ_PROVIDER`
  env vars (see `.env.example`).

Services (`cep.service.ts`, `cnpj.service.ts`) only depend on the
interface. Swapping a data source means writing a new file that
implements `CepProvider`/`CnpjProvider` and registering it — no changes
to controllers, routes, schemas, caching, or error handling.

## Why this exists: licensing, not just code structure

This API was originally built against **ViaCEP** (CEP) and **BrasilAPI**
(CNPJ), both free/public, unauthenticated community services. That is a
fine foundation for a free tier or MVP. It is a different question
whether it's fine to **resell live lookups against those same upstream
services** as a paid product (e.g. a paid RapidAPI plan) — that depends
on each provider's terms around commercial use and redistribution, not
on whether the API happens to work.

**Nothing in this document is legal advice.** It's a plain summary of
what each provider's own public materials say, so the actual legal call
can be made with that in hand instead of an assumption baked silently
into the code.

### CEP: ViaCEP (current default)

- Free, unauthenticated, extremely widely used in the Brazilian dev
  community.
- ViaCEP's own site states it does **not distribute or sell its
  database** ("Não distribuímos ou comercializamos bases de dados") and
  warns that bulk/automated validation traffic against it can get an IP
  blocked without notice.
- That statement is specifically about not licensing out their *raw
  database* for redistribution — it is not the same thing as a written
  grant to resell live per-lookup API calls through a third-party paid
  product. Third-party blog posts differ on whether "moderate" commercial
  use is fine; none of that is a substitute for ViaCEP's own written
  terms, and no such written commercial-use grant was found.
- **Status: kept as the default provider** (nothing changed here vs.
  before this change) because it's the right fit for the current
  free/MVP tier and switching it out was not something that could be
  done safely without inventing a permission that doesn't clearly exist.

**Documented but unimplemented alternative: Correios (SIGEP Web).**
Correios (the postal service) is the authoritative source of CEP data
and does offer commercial-grade access, but it requires a contract/login
(SIGEP Web) that this project does not have. `CEP_PROVIDER=correios` is
listed in the config to mark this as the intended extension point, but
selecting it currently throws a clear "not implemented, needs a SIGEP
Web contract" error rather than silently doing nothing or crashing
obscurely.

### CNPJ: BrasilAPI (current default)

- Free, unauthenticated, community-maintained aggregator. For CNPJ
  specifically, BrasilAPI itself re-serves the Receita Federal's own
  public CNPJ dataset.
- The underlying Receita Federal data is published as open data, but
  BrasilAPI (the layer this project actually calls) does not publish a
  written commercial-redistribution license or an SLA of its own.
  "Built on open government data" is not the same claim as "licensed for
  commercial resale through this specific free aggregator" — the
  aggregator's own terms are what would need to say that, and none were
  found saying it.
- Swapping the *client library* (e.g. an npm wrapper around the same
  free sources) doesn't change this — it's still the same underlying
  data source and the same absence of a written commercial grant, just
  through a different package.
- **Status: kept as the default provider**, same reasoning as ViaCEP
  above.

**Documented but unimplemented alternative: Receita Federal's official
"Consulta CNPJ" API.** This is the government's own OAuth2-authenticated
API (registration via gov.br/conecta), which is the actually clean path
for a commercial product — but it requires registering an OAuth2 client
and obtaining credentials this project does not have. `CNPJ_PROVIDER=
receita-federal` is listed as the intended extension point; selecting it
currently throws a clear "not implemented, needs gov.br/conecta OAuth2
credentials" error.

## Before turning on a paid/commercial tier

1. Decide which of the two paths above you want for each of CEP and
   CNPJ: (a) get written commercial terms from a provider that
   explicitly grants resale/redistribution (Correios SIGEP Web contract,
   Receita Federal gov.br/conecta credentials, or a commercial vendor
   whose ToS says so in writing), or (b) get explicit written
   confirmation from ViaCEP/BrasilAPI that your intended commercial use
   is fine.
2. Implement the corresponding `CepProvider`/`CnpjProvider` for that
   source (the interface and registry are already in place for this).
3. Update `CEP_PROVIDER` / `CNPJ_PROVIDER` for the commercial deployment
   only — the free tier can keep using the current defaults if that's
   the intended product shape (free tier on free data, paid tier on
   licensed data).

Nothing in this codebase should be read as confirming that reselling
ViaCEP or BrasilAPI data commercially is fine — that determination
wasn't made here and shouldn't be assumed from the fact that the
integration works technically.
