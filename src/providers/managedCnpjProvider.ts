import { env } from '../config/env';
import type { CnpjResponse } from '../schemas/cnpj.schema';
import type { CnpjProvider } from './cnpjProvider';
import { brasilApiCnpjProvider } from './brasilApiCnpjProvider';
import { openCnpjProvider } from './openCnpjProvider';
import { ProviderManager } from './providerManager';

const manager = new ProviderManager<CnpjResponse>([
  { name: brasilApiCnpjProvider.name, execute: () => brasilApiCnpjProvider.getCompanyByCnpj(currentCnpj) },
  { name: openCnpjProvider.name, execute: () => openCnpjProvider.getCompanyByCnpj(currentCnpj) },
]);

let currentCnpj = '';

export const managedCnpjProvider: CnpjProvider = {
  name: 'ProviderManager(BrasilAPI -> OpenCNPJ)',
  async getCompanyByCnpj(cnpj: string): Promise<CnpjResponse | null> {
    currentCnpj = cnpj;
    try {
      return (await manager.execute()).value;
    } finally {
      currentCnpj = '';
    }
  },
};

export function getCnpjProviderStats() {
  return manager.getStats();
}
