import { providers } from '../config/providers';
import type { CityResponse, StateResponse } from '../schemas/location.schema';
import { ibgeCityRawSchema, ibgeStateRawSchema } from '../schemas/location.schema';
import { citiesCache, CACHE_TTL_MS, statesCache } from '../config/cache';
import { NotFoundError, UpstreamError } from '../utils/errors';
import { fetchJson } from '../utils/httpClient';
import { z } from 'zod';

export async function listStates(): Promise<StateResponse[]> {
  const cacheKey = 'states';
  const cached = statesCache.get(cacheKey);
  if (cached) return cached;

  const url = `${providers.ibgeLocalidades.baseUrl}/estados?orderBy=nome`;
  const raw = await fetchJson<unknown[]>(url, { providerName: providers.ibgeLocalidades.name });
  const parsed = z.array(ibgeStateRawSchema).safeParse(raw ?? []);

  if (!parsed.success) {
    throw new UpstreamError('IBGE Localidades returned an unexpected payload shape.', {
      issues: parsed.error.issues,
    });
  }

  const result = parsed.data.map((state) => ({
    id: state.id,
    name: state.nome,
    stateCode: state.sigla,
    region: state.regiao.nome,
  }));

  statesCache.set(cacheKey, result, CACHE_TTL_MS.states);
  return result;
}

export async function getStateByCode(stateCode: string): Promise<StateResponse> {
  const url = `${providers.ibgeLocalidades.baseUrl}/estados/${stateCode}`;
  const raw = await fetchJson<unknown>(url, {
    providerName: providers.ibgeLocalidades.name,
    treatAsNotFound: [404],
  });

  if (raw === null) throw new NotFoundError(`Unknown state code "${stateCode}".`);

  const parsed = ibgeStateRawSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UpstreamError('IBGE Localidades returned an unexpected payload shape.', {
      issues: parsed.error.issues,
    });
  }

  return {
    id: parsed.data.id,
    name: parsed.data.nome,
    stateCode: parsed.data.sigla,
    region: parsed.data.regiao.nome,
  };
}

export async function listCitiesByState(stateCode: string): Promise<CityResponse[]> {
  const cacheKey = `cities:${stateCode}`;
  const cached = citiesCache.get(cacheKey);
  if (cached) return cached;

  const url = `${providers.ibgeLocalidades.baseUrl}/estados/${stateCode}/municipios`;
  const raw = await fetchJson<unknown[]>(url, {
    providerName: providers.ibgeLocalidades.name,
    treatAsNotFound: [404],
  });

  if (raw === null) throw new NotFoundError(`Unknown state code "${stateCode}".`);

  const parsed = z.array(ibgeCityRawSchema).safeParse(raw);
  if (!parsed.success) {
    throw new UpstreamError('IBGE Localidades returned an unexpected payload shape.', {
      issues: parsed.error.issues,
    });
  }
  if (parsed.data.length === 0) throw new NotFoundError(`Unknown state code "${stateCode}".`);

  const result = parsed.data.map((city) => ({ id: city.id, name: city.nome, stateCode }));
  citiesCache.set(cacheKey, result, CACHE_TTL_MS.cities);
  return result;
}
