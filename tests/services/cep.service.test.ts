import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAddressByCep } from '../../src/services/cep.service';
import { NotFoundError } from '../../src/utils/errors';

function mockFetchOnce(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
    }),
  );
}

describe('cep.service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps a ViaCEP response to the consistent CEP shape', async () => {
    mockFetchOnce({
      cep: '69000-000',
      logradouro: 'Rua Exemplo',
      bairro: 'Centro',
      localidade: 'Manaus',
      uf: 'AM',
    });

    const result = await getAddressByCep('69000000');

    expect(result).toEqual({
      cep: '69000000',
      street: 'Rua Exemplo',
      neighborhood: 'Centro',
      city: 'Manaus',
      state: 'Amazonas',
      stateCode: 'AM',
    });
  });

  it('throws NotFoundError when ViaCEP reports erro: true', async () => {
    mockFetchOnce({ erro: true });

    await expect(getAddressByCep('99999999')).rejects.toBeInstanceOf(NotFoundError);
  });
});
