import { TtlCache } from '../utils/cache';
import type { CityResponse, StateResponse } from '../schemas/location.schema';
import type { HolidayResponse } from '../schemas/holidays.schema';

export const CACHE_TTL_MS = {
  states: 24 * 60 * 60 * 1000,
  cities: 24 * 60 * 60 * 1000,
  holidays: 24 * 60 * 60 * 1000,
} as const;

export const statesCache = new TtlCache<StateResponse[]>();
export const citiesCache = new TtlCache<CityResponse[]>();
export const holidaysCache = new TtlCache<HolidayResponse[]>();

export function getCacheStats() {
  const states = statesCache.getStats();
  const cities = citiesCache.getStats();
  const holidays = holidaysCache.getStats();

  return {
    hits: states.hits + cities.hits + holidays.hits,
    misses: states.misses + cities.misses + holidays.misses,
    entries: states.entries + cities.entries + holidays.entries,
  };
}
