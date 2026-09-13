import { CACHE_TTL_MS, cnpjCache } from '../config/cache';
import { getCnpjProvider } from '../providers/cnpjProviderRegistry';
import type { CnpjResponse } from '../schemas/cnpj.schema';
import { NotFoundError } from '../utils/errors';

export async function getCompanyByCnpj(cnpj: string): Promise<CnpjResponse> {
  const cached = cnpjCache.get(cnpj);
  if (cached) return cached;

  const provider = getCnpjProvider();
  const result = await provider.getCompanyByCnpj(cnpj);

  if (!result) {
    throw new NotFoundError(`No company found for CNPJ ${cnpj}.`);
  }

  cnpjCache.set(cnpj, result, CACHE_TTL_MS.cnpj);

  return result;
}
