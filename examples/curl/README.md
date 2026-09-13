# cURL examples

Production base URL:

```text
https://brasil-data-api.onrender.com
```

Set your API key in an environment variable instead of putting it directly in shell history:

```bash
export BRAZIL_DATA_API_KEY="YOUR_KEY"
```

On PowerShell:

```powershell
$env:BRAZIL_DATA_API_KEY="YOUR_KEY"
```

## Health check

No API key is required:

```bash
curl https://brasil-data-api.onrender.com/health
```

## CEP lookup

```bash
curl \
  -H "x-api-key: $BRAZIL_DATA_API_KEY" \
  https://brasil-data-api.onrender.com/api/v1/cep/69000000
```

## CNPJ lookup

```bash
curl \
  -H "x-api-key: $BRAZIL_DATA_API_KEY" \
  https://brasil-data-api.onrender.com/api/v1/cnpj/19131243000197
```

## Complete company lookup

```bash
curl \
  -H "x-api-key: $BRAZIL_DATA_API_KEY" \
  https://brasil-data-api.onrender.com/api/v1/empresa-completa/19131243000197
```

## List states

```bash
curl \
  -H "x-api-key: $BRAZIL_DATA_API_KEY" \
  https://brasil-data-api.onrender.com/api/v1/states
```

## List cities of a state

```bash
curl \
  -H "x-api-key: $BRAZIL_DATA_API_KEY" \
  https://brasil-data-api.onrender.com/api/v1/states/AM/cities
```

## National holidays

```bash
curl \
  -H "x-api-key: $BRAZIL_DATA_API_KEY" \
  https://brasil-data-api.onrender.com/api/v1/holidays/2026
```

## API documentation

Swagger UI:

```text
https://brasil-data-api.onrender.com/api-docs
```

OpenAPI source:

```text
https://github.com/mrJoao28/Brasil-Data-API/blob/main/docs/openapi.yaml
```
