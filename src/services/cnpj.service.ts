import { CACHE_TTL_MS, cnpjCache } from '../config/cache';
import { env } from '../config/env';
import { getCnpjProvider } from '../providers/cnpjProviderRegistry';
import { getManagedCompanyByCnpj } from '../providers/managedCnpjProvider';
import type { CnpjResponse } from '../schemas/cnpj.schema';
import { NotFoundError } from '../utils/errors';

export interface CnpjServiceResult {
  company: CnpjResponse;
  provider: string;
}

export async function getCompanyByCnpjWithProvider(cnpj: string): Promise<CnpjServiceResult> {
  const cached = cnpjCache.get(cnpj);
  if (cached) return { company: cached, provider: 'cache' };

  const selected = env.CNPJ_PROVIDER === 'failover'
    ? await getManagedCompanyByCnpj(cnpj)
    : { value: await getCnpjProvider().getCompanyByCnpj(cnpj), provider: getCnpjProvider().name };

  if (!selected.value) {
    throw new NotFoundError(`No company found for CNPJ ${cnpj}.`);
  }

  cnpjCache.set(cnpj, selected.value, CACHE_TTL_MS.cnpj);
  return { company: selected.value, provider: selected.provider };
}

export async function getCompanyByCnpj(cnpj: string): Promise<CnpjResponse> {
  return (await getCompanyByCnpjWithProvider(cnpj)).company;
}
