# JavaScript examples

These examples use the native `fetch` API available in modern Node.js.

Set your API key before running:

```bash
export BRAZIL_DATA_API_KEY="YOUR_KEY"
```

On PowerShell:

```powershell
$env:BRAZIL_DATA_API_KEY="YOUR_KEY"
```

## CEP lookup

```js
const API_URL = 'https://brasil-data-api.onrender.com';
const API_KEY = process.env.BRAZIL_DATA_API_KEY;

const response = await fetch(`${API_URL}/api/v1/cep/69000000`, {
  headers: { 'x-api-key': API_KEY },
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${await response.text()}`);
}

console.log(await response.json());
```

## CNPJ lookup

```js
const API_URL = 'https://brasil-data-api.onrender.com';
const API_KEY = process.env.BRAZIL_DATA_API_KEY;
const cnpj = '19131243000197';

const response = await fetch(`${API_URL}/api/v1/cnpj/${cnpj}`, {
  headers: { 'x-api-key': API_KEY },
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${await response.text()}`);
}

const company = await response.json();
console.log(company);
```

## Complete company lookup

```js
const response = await fetch(
  'https://brasil-data-api.onrender.com/api/v1/empresa-completa/19131243000197',
  { headers: { 'x-api-key': process.env.BRAZIL_DATA_API_KEY } },
);

console.log(await response.json());
```

## List states

```js
const response = await fetch(
  'https://brasil-data-api.onrender.com/api/v1/states',
  { headers: { 'x-api-key': process.env.BRAZIL_DATA_API_KEY } },
);

console.log(await response.json());
```

## List cities of a state

```js
const uf = 'AM';
const response = await fetch(
  `https://brasil-data-api.onrender.com/api/v1/states/${uf}/cities`,
  { headers: { 'x-api-key': process.env.BRAZIL_DATA_API_KEY } },
);

console.log(await response.json());
```

## National holidays

```js
const year = 2026;
const response = await fetch(
  `https://brasil-data-api.onrender.com/api/v1/holidays/${year}`,
  { headers: { 'x-api-key': process.env.BRAZIL_DATA_API_KEY } },
);

console.log(await response.json());
```

## Notes

- Never hard-code or commit your API key.
- The production base URL is `https://brasil-data-api.onrender.com`.
- See `/api-docs` for the complete OpenAPI contract.
