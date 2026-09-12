import { providers } from '../config/providers';
import type { CepResponse } from '../schemas/cep.schema';
import { viaCepRawSchema } from '../schemas/cep.schema';
import { NotFoundError, UpstreamError } from '../utils/errors';
import { fetchJson } from '../utils/httpClient';

/**
 * Full names for Brazilian state abbreviations. ViaCEP only returns the
 * `uf` (2-letter code), not the full state name, so we map it here to
 * satisfy our consistent response contract (`state` + `stateCode`).
 */
const STATE_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

export async function getAddressByCep(cep: string): Promise<CepResponse> {
  const url = `${providers.viaCep.baseUrl}/${cep}/json`;

  const raw = await fetchJson(url, { providerName: providers.viaCep.name });

  if (!raw) {
    throw new NotFoundError(`No address found for CEP ${cep}.`);
  }

  const parsed = viaCepRawSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UpstreamError('ViaCEP returned an unexpected payload shape.', {
      issues: parsed.error.issues,
    });
  }

  // ViaCEP responds 200 OK with { erro: true } for well-formed but
  // non-existent CEPs, instead of a 404 status code.
  if (parsed.data.erro) {
    throw new NotFoundError(`No address found for CEP ${cep}.`);
  }

  const stateCode = (parsed.data.uf ?? '').toUpperCase();

  return {
    cep: parsed.data.cep?.replace(/\D/g, '') ?? cep,
    street: parsed.data.logradouro ?? '',
    neighborhood: parsed.data.bairro ?? '',
    city: parsed.data.localidade ?? '',
    state: STATE_NAMES[stateCode] ?? stateCode,
    stateCode,
  };
}
