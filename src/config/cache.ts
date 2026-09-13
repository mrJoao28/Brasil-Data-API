import { TtlCache } from '../utils/cache';
import type { CityResponse, StateResponse } from '../schemas/location.schema';
import type { HolidayResponse } from '../schemas/holidays.schema';
import type { CnpjResponse } from '../schemas/cnpj.schema';

export const CACHE_TTL_MS = {
  states: 24 * 60 * 60 * 1000,
  cities: 24 * 60 * 60 * 1000,
  holidays: 24 * 60 * 60 * 1000,
  // Company registration data changes rarely; a shorter TTL than the
  // static geographic/holiday lookups still cuts most repeat-lookup
  // traffic to the upstream CNPJ provider without serving stale data
  // for too long after a real update (e.g. address change).
  cnpj: 60 * 60 * 1000,
} as const;

export const statesCache = new TtlCache<StateResponse[]>();
export const citiesCache = new TtlCache<CityResponse[]>();
export const holidaysCache = new TtlCache<HolidayResponse[]>();
export const cnpjCache = new TtlCache<CnpjResponse>();

export function getCacheStats() {
  const states = statesCache.getStats();
  const cities = citiesCache.getStats();
  const holidays = holidaysCache.getStats();
  const cnpj = cnpjCache.getStats();

  return {
    hits: states.hits + cities.hits + holidays.hits + cnpj.hits,
    misses: states.misses + cities.misses + holidays.misses + cnpj.misses,
    entries: states.entries + cities.entries + holidays.entries + cnpj.entries,
  };
}
