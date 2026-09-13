import { describe, expect, it } from 'vitest';

const baseUrl = process.env.E2E_BASE_URL?.replace(/\/$/, '');
const apiKey = process.env.E2E_API_KEY;
const cep = process.env.E2E_CEP;
const cnpj = process.env.E2E_CNPJ;

const enabled = Boolean(baseUrl && apiKey && cep && cnpj);

describe.skipIf(!enabled)('production smoke', () => {
  async function request(path: string): Promise<Response> {
    return fetch(`${baseUrl}${path}`, { headers: { 'x-api-key': apiKey! } });
  }

  it('health is available', async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
  });

  it('states endpoint is available', async () => {
    const response = await request('/api/v1/states');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  it('CEP endpoint is available', async () => {
    const response = await request(`/api/v1/cep/${cep}`);
    expect([200, 404]).toContain(response.status);
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  it('CNPJ endpoint is available and identifies provider', async () => {
    const response = await request(`/api/v1/cnpj/${cnpj}`);
    expect([200, 404]).toContain(response.status);
    if (response.status === 200) expect(response.headers.get('x-provider')).toBeTruthy();
  });

  it('metrics endpoint is available', async () => {
    const response = await request('/api/v1/metrics');
    expect(response.status).toBe(200);
  });
});
