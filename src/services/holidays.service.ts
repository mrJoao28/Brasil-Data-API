import { providers } from '../config/providers';
import { CACHE_TTL_MS, holidaysCache } from '../config/cache';
import type { HolidayResponse } from '../schemas/holidays.schema';
import { brasilApiHolidaysRawSchema } from '../schemas/holidays.schema';
import { NotFoundError, UpstreamError } from '../utils/errors';
import { fetchJson } from '../utils/httpClient';

export async function listHolidaysByYear(year: number): Promise<HolidayResponse[]> {
  const cacheKey = `holidays:${year}`;
  const cached = holidaysCache.get(cacheKey);
  if (cached) return cached;

  const url = `${providers.brasilApi.baseUrl}/feriados/v1/${year}`;
  const raw = await fetchJson<unknown>(url, {
    providerName: providers.brasilApi.name,
    treatAsNotFound: [404],
  });

  if (raw === null) throw new NotFoundError(`No holiday data available for year ${year}.`);

  const parsed = brasilApiHolidaysRawSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UpstreamError('BrasilAPI returned an unexpected payload shape.', {
      issues: parsed.error.issues,
    });
  }

  const result = parsed.data.map((holiday) => ({
    date: holiday.date,
    name: holiday.name,
    type: holiday.type,
  }));

  holidaysCache.set(cacheKey, result, CACHE_TTL_MS.holidays);
  return result;
}
