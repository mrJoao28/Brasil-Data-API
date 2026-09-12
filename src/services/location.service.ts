import { providers } from '../config/providers';
import type { CityResponse, StateResponse } from '../schemas/location.schema';
import { ibgeCityRawSchema, ibgeStateRawSchema } from '../schemas/location.schema';
import { NotFoundError, UpstreamError } from '../utils/errors';
import { fetchJson } from '../utils/httpClient';
import { z } from 'zod';

export async function listStates(): Promise<StateResponse[]> {
  const url = `${providers.ibgeLocalidades.baseUrl}/estados?orderBy=nome`;

  const raw = await fetchJson<unknown[]>(url, { providerName: providers.ibgeLocalidades.name });

  const parsed = z.array(ibgeStateRawSchema).safeParse(raw ?? []);
  if (!parsed.success) {
    throw new UpstreamError('IBGE Localidades returned an unexpected payload shape.', {
      issues: parsed.error.issues,
    });
  }

  return parsed.data.map((state) => ({
    id: state.id,
    name: state.nome,
    stateCode: state.sigla,
    region: state.regiao.nome,
  }));
}

export async function listCitiesByState(stateCode: string): Promise<CityResponse[]> {
  const url = `${providers.ibgeLocalidades.baseUrl}/estados/${stateCode}/municipios`;

  const raw = await fetchJson<unknown>(url, {
    providerName: providers.ibgeLocalidades.name,
    // IBGE returns 404 for an unknown/invalid UF.
    treatAsNotFound: [404],
  });

  if (raw === null) {
    throw new NotFoundError(`Unknown state code "${stateCode}".`);
  }

  const parsed = z.array(ibgeCityRawSchema).safeParse(raw);
  if (!parsed.success) {
    throw new UpstreamError('IBGE Localidades returned an unexpected payload shape.', {
      issues: parsed.error.issues,
    });
  }

  if (parsed.data.length === 0) {
    throw new NotFoundError(`Unknown state code "${stateCode}".`);
  }

  return parsed.data.map((city) => ({
    id: city.id,
    name: city.nome,
    stateCode,
  }));
}
