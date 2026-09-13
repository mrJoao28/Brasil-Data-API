import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError, UpstreamError } from '../../src/utils/errors';

vi.mock('../../src/services/cnpj.service', () => ({
  getCompanyByCnpj: vi.fn(),
}));
vi.mock('../../src/services/cep.service', () => ({
  getAddressByCep: vi.fn(),
}));
vi.mock('../../src/services/location.service', () => ({
  getStateByCode: vi.fn(),
}));

import { getAddressByCep } from '../../src/services/cep.service';
import { getCompanyByCnpj } from '../../src/services/cnpj.service';
import { getEmpresaCompleta } from '../../src/services/empresaCompleta.service';
import { getStateByCode } from '../../src/services/location.service';

const company = {
  cnpj: '19131243000197',
  legalName: 'OPEN KNOWLEDGE BRASIL',
  tradeName: 'OKBR',
  status: 'ATIVA',
  openedAt: '2013-05-06',
  mainActivity: 'Atividades de organizações associativas',
  city: 'SAO PAULO',
  state: 'SP',
  cep: '01310100',
};

const address = {
  cep: '01310100',
  street: 'Avenida Paulista',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'São Paulo',
  stateCode: 'SP',
};

const state = { id: 35, name: 'São Paulo', stateCode: 'SP', region: 'Sudeste' };

describe('empresaCompleta.service', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('combines company, address and state when every sub-call succeeds', async () => {
    vi.mocked(getCompanyByCnpj).mockResolvedValue(company);
    vi.mocked(getAddressByCep).mockResolvedValue(address);
    vi.mocked(getStateByCode).mockResolvedValue(state);

    const result = await getEmpresaCompleta('19131243000197');

    expect(result).toEqual({ company, address, state, warnings: [] });
    expect(getAddressByCep).toHaveBeenCalledWith('01310100');
    expect(getStateByCode).toHaveBeenCalledWith('SP');
  });

  it('propagates a failure from the primary CNPJ lookup', async () => {
    vi.mocked(getCompanyByCnpj).mockRejectedValue(new NotFoundError('No company found.'));

    await expect(getEmpresaCompleta('00000000000000')).rejects.toBeInstanceOf(NotFoundError);
    expect(getAddressByCep).not.toHaveBeenCalled();
    expect(getStateByCode).not.toHaveBeenCalled();
  });

  it('returns a partial response with a warning when the CEP lookup fails', async () => {
    vi.mocked(getCompanyByCnpj).mockResolvedValue(company);
    vi.mocked(getAddressByCep).mockRejectedValue(new UpstreamError('ViaCEP is down.'));
    vi.mocked(getStateByCode).mockResolvedValue(state);

    const result = await getEmpresaCompleta('19131243000197');

    expect(result.address).toBeNull();
    expect(result.state).toEqual(state);
    expect(result.warnings).toEqual([
      'Could not resolve address for CEP 01310100: ViaCEP is down.',
    ]);
  });

  it('returns a partial response with a warning when the state lookup fails', async () => {
    vi.mocked(getCompanyByCnpj).mockResolvedValue(company);
    vi.mocked(getAddressByCep).mockResolvedValue(address);
    vi.mocked(getStateByCode).mockRejectedValue(new NotFoundError('Unknown state code "SP".'));

    const result = await getEmpresaCompleta('19131243000197');

    expect(result.address).toEqual(address);
    expect(result.state).toBeNull();
    expect(result.warnings).toEqual([
      'Could not resolve state for UF SP: Unknown state code "SP".',
    ]);
  });

  it('skips address/state lookups and warns when the company has no CEP or UF on file', async () => {
    vi.mocked(getCompanyByCnpj).mockResolvedValue({ ...company, cep: null, state: null });

    const result = await getEmpresaCompleta('19131243000197');

    expect(result.address).toBeNull();
    expect(result.state).toBeNull();
    expect(getAddressByCep).not.toHaveBeenCalled();
    expect(getStateByCode).not.toHaveBeenCalled();
    expect(result.warnings).toEqual([
      'Company record has no CEP on file; address lookup skipped.',
      'Company record has no UF on file; state lookup skipped.',
    ]);
  });
});
