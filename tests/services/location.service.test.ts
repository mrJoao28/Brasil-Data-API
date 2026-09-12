import { afterEach, describe, expect, it, vi } from 'vitest';
import { listCitiesByState, listStates } from '../../src/services/location.service';
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

describe('location.service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps IBGE states payload to the consistent shape', async () => {
    mockFetchOnce([
      { id: 13, sigla: 'AM', nome: 'Amazonas', regiao: { id: 1, sigla: 'N', nome: 'Norte' } },
    ]);

    const result = await listStates();

    expect(result).toEqual([{ id: 13, name: 'Amazonas', stateCode: 'AM', region: 'Norte' }]);
  });

  it('maps IBGE cities payload to the consistent shape', async () => {
    mockFetchOnce([{ id: 1302603, nome: 'Manaus' }]);

    const result = await listCitiesByState('AM');

    expect(result).toEqual([{ id: 1302603, name: 'Manaus', stateCode: 'AM' }]);
  });

  it('throws NotFoundError for an unknown state code (empty array)', async () => {
    mockFetchOnce([]);

    await expect(listCitiesByState('ZZ')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when IBGE responds 404', async () => {
    mockFetchOnce({}, 404);

    await expect(listCitiesByState('ZZ')).rejects.toBeInstanceOf(NotFoundError);
  });
});
