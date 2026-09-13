import { env } from '../config/env';
import type { CepResponse } from '../schemas/cep.schema';
import { viaCepRawSchema } from '../schemas/cep.schema';
import { UpstreamError } from '../utils/errors';
import { fetchJson } from '../utils/httpClient';
import type { CepProvider } from './cepProvider';

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

/**
 * ViaCEP-backed implementation of `CepProvider`.
 *
 * Licensing note (see docs/PROVIDERS.md for the full write-up): ViaCEP is
 * free and unauthenticated, but its own site states it does not
 * distribute or sell its database ("Não distribuímos ou comercializamos
 * bases de dados") and warns that bulk/automated validation traffic can
 * get an IP blocked. That is a statement about ViaCEP not licensing you
 * their raw database for redistribution — it is not a clear, written
 * grant to resell live lookups through a paid third-party API. Treat
 * this provider as suitable for the current free/MVP tier; before
 * shipping a paid commercial tier on RapidAPI, get a written commercial
 * agreement (e.g. Correios/SIGEP, or a vendor whose ToS explicitly
 * covers commercial redistribution) rather than relying on this
 * default.
 */
export const viaCepProvider: CepProvider = {
  name: 'ViaCEP',

  async getAddressByCep(cep: string): Promise<CepResponse | null> {
    const url = `${env.VIACEP_BASE_URL}/${cep}/json`;

    const raw = await fetchJson(url, { providerName: 'ViaCEP' });

    if (!raw) return null;

    const parsed = viaCepRawSchema.safeParse(raw);
    if (!parsed.success) {
      throw new UpstreamError('ViaCEP returned an unexpected payload shape.', {
        issues: parsed.error.issues,
      });
    }

    // ViaCEP responds 200 OK with { erro: true } for well-formed but
    // non-existent CEPs, instead of a 404 status code.
    if (parsed.data.erro) return null;

    const stateCode = (parsed.data.uf ?? '').toUpperCase();

    return {
      cep: parsed.data.cep?.replace(/\D/g, '') ?? cep,
      street: parsed.data.logradouro ?? '',
      neighborhood: parsed.data.bairro ?? '',
      city: parsed.data.localidade ?? '',
      state: STATE_NAMES[stateCode] ?? stateCode,
      stateCode,
    };
  },
};
