import type { CepResponse } from '../schemas/cep.schema';
import { NotFoundError } from '../utils/errors';
import { getCepProvider } from '../providers/cepProviderRegistry';

export async function getAddressByCep(cep: string): Promise<CepResponse> {
  const provider = getCepProvider();
  const result = await provider.getAddressByCep(cep);

  if (!result) {
    throw new NotFoundError(`No address found for CEP ${cep}.`);
  }

  return result;
}
