import type { CnpjResponse } from '../schemas/cnpj.schema';
import type { CnpjProvider } from './cnpjProvider';
import { brasilApiCnpjProvider } from './brasilApiCnpjProvider';
import { openCnpjProvider } from './openCnpjProvider';
import { ProviderManager } from './providerManager';

const manager = new ProviderManager<CnpjResponse, string>([
  { name: brasilApiCnpjProvider.name, execute: (cnpj) => brasilApiCnpjProvider.getCompanyByCnpj(cnpj) },
  { name: openCnpjProvider.name, execute: (cnpj) => openCnpjProvider.getCompanyByCnpj(cnpj) },
]);

export const managedCnpjProvider: CnpjProvider = {
  name: 'ProviderManager(BrasilAPI -> OpenCNPJ)',
  async getCompanyByCnpj(cnpj: string): Promise<CnpjResponse | null> {
    return (await manager.execute(cnpj)).value;
  },
};

export async function getManagedCompanyByCnpj(cnpj: string): Promise<{ value: CnpjResponse | null; provider: string }> {
  return manager.execute(cnpj);
}

export function getCnpjProviderStats() {
  return manager.getStats();
}
