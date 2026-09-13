# Python examples

These examples use Python 3.10+ and the `requests` package.

Install the dependency:

```bash
pip install requests
```

Set your API key:

```bash
export BRAZIL_DATA_API_KEY="YOUR_KEY"
```

On PowerShell:

```powershell
$env:BRAZIL_DATA_API_KEY="YOUR_KEY"
```

## CEP lookup

```python
import os
import requests

API_URL = "https://brasil-data-api.onrender.com"
API_KEY = os.environ["BRAZIL_DATA_API_KEY"]

response = requests.get(
    f"{API_URL}/api/v1/cep/69000000",
    headers={"x-api-key": API_KEY},
    timeout=10,
)
response.raise_for_status()

print(response.json())
```

## CNPJ lookup

```python
import os
import requests

API_URL = "https://brasil-data-api.onrender.com"
API_KEY = os.environ["BRAZIL_DATA_API_KEY"]
cnpj = "19131243000197"

response = requests.get(
    f"{API_URL}/api/v1/cnpj/{cnpj}",
    headers={"x-api-key": API_KEY},
    timeout=10,
)
response.raise_for_status()

company = response.json()
print(company)
```

## Complete company lookup

```python
import os
import requests

response = requests.get(
    "https://brasil-data-api.onrender.com/api/v1/empresa-completa/19131243000197",
    headers={"x-api-key": os.environ["BRAZIL_DATA_API_KEY"]},
    timeout=10,
)
response.raise_for_status()

print(response.json())
```

## List states

```python
import os
import requests

response = requests.get(
    "https://brasil-data-api.onrender.com/api/v1/states",
    headers={"x-api-key": os.environ["BRAZIL_DATA_API_KEY"]},
    timeout=10,
)
response.raise_for_status()

print(response.json())
```

## List cities of a state

```python
import os
import requests

uf = "AM"
response = requests.get(
    f"https://brasil-data-api.onrender.com/api/v1/states/{uf}/cities",
    headers={"x-api-key": os.environ["BRAZIL_DATA_API_KEY"]},
    timeout=10,
)
response.raise_for_status()

print(response.json())
```

## National holidays

```python
import os
import requests

year = 2026
response = requests.get(
    f"https://brasil-data-api.onrender.com/api/v1/holidays/{year}",
    headers={"x-api-key": os.environ["BRAZIL_DATA_API_KEY"]},
    timeout=10,
)
response.raise_for_status()

print(response.json())
```

## Notes

- Never hard-code or commit your API key.
- The production base URL is `https://brasil-data-api.onrender.com`.
- See `/api-docs` for the complete OpenAPI contract.
