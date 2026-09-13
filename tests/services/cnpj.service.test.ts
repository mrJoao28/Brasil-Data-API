import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cnpjCache } from '../../src/config/cache';
import { getCompanyByCnpj } from '../../src/services/cnpj.service';
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

describe('cnpj.service', () => {
  // The CNPJ cache is a module-level singleton (same instance the service
  // imports), so tests reusing the same CNPJ must start from a clean slate
  // or they'd read each other's cached results instead of hitting fetch.
  beforeEach(() => {
    cnpjCache.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps enriched BrasilAPI CNPJ data to the consistent shape', async () => {
    mockFetchOnce({
      cnpj: '19131243000197',
      razao_social: 'OPEN KNOWLEDGE BRASIL',
      nome_fantasia: 'OKBR',
      descricao_situacao_cadastral: 'ATIVA',
      data_inicio_atividade: '2013-05-06',
      cnae_fiscal_descricao: 'Atividades de organizações associativas',
      cnae_fiscal: 9493600,
      cnaes_secundarios: [
        { codigo: 6204000, descricao: 'Consultoria em tecnologia da informação' },
      ],
      natureza_juridica: 'Associação Privada',
      porte: 'DEMAIS',
      municipio: 'SAO PAULO',
      uf: 'SP',
      cep: '01.310-100',
      logradouro: 'PAULISTA 37',
      numero: '37',
      bairro: 'BELA VISTA',
      complemento: 'ANDAR 4',
    });

    const result = await getCompanyByCnpj('19131243000197');

    expect(result).toEqual({
      cnpj: '19131243000197',
      legalName: 'OPEN KNOWLEDGE BRASIL',
      tradeName: 'OKBR',
      status: 'ATIVA',
      openedAt: '2013-05-06',
      mainActivity: 'Atividades de organizações associativas',
      mainActivityCode: 9493600,
      secondaryActivities: [
        { code: 6204000, description: 'Consultoria em tecnologia da informação' },
      ],
      legalNature: 'Associação Privada',
      companySize: 'DEMAIS',
      city: 'SAO PAULO',
      state: 'SP',
      cep: '01310100',
      street: 'PAULISTA 37',
      number: '37',
      neighborhood: 'BELA VISTA',
      complement: 'ANDAR 4',
    });
  });

  it('throws NotFoundError when BrasilAPI responds 404', async () => {
    mockFetchOnce({}, 404);
    await expect(getCompanyByCnpj('00000000000000')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('defaults new nullable fields when missing from the payload', async () => {
    mockFetchOnce({ cnpj: '19131243000197', razao_social: 'EMPRESA SEM FANTASIA' });

    const result = await getCompanyByCnpj('19131243000197');

    expect(result.tradeName).toBeNull();
    expect(result.openedAt).toBeNull();
    expect(result.mainActivity).toBeNull();
    expect(result.mainActivityCode).toBeNull();
    expect(result.secondaryActivities).toEqual([]);
    expect(result.legalNature).toBeNull();
    expect(result.companySize).toBeNull();
    expect(result.cep).toBeNull();
  });

  it('caches a successful lookup and does not call fetch again for the same CNPJ', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ cnpj: '19131243000197', razao_social: 'OPEN KNOWLEDGE BRASIL' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await getCompanyByCnpj('19131243000197');
    const second = await getCompanyByCnpj('19131243000197');

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
