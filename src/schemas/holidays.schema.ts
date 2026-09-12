import { z } from 'zod';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * BrasilAPI's feriados endpoint only has reliable data roughly from
 * 1900 to a few years in the future (moving holidays like Carnaval are
 * computed algorithmically). We bound the range generously but still
 * reject obviously invalid years early with a clear error.
 */
export const yearParamSchema = z.object({
  year: z.coerce
    .number({ invalid_type_error: 'Year must be a number.' })
    .int('Year must be an integer.')
    .min(1900, 'Year must be 1900 or later.')
    .max(CURRENT_YEAR + 10, `Year must be ${CURRENT_YEAR + 10} or earlier.`),
});

export type YearParam = z.infer<typeof yearParamSchema>;

export const holidayResponseSchema = z.object({
  date: z.string(),
  name: z.string(),
  type: z.string(),
});

export type HolidayResponse = z.infer<typeof holidayResponseSchema>;

export const holidaysResponseSchema = z.array(holidayResponseSchema);

/** Raw shape returned by BrasilAPI's /feriados/v1/{year} endpoint. */
export const brasilApiHolidayRawSchema = z.object({
  date: z.string(),
  name: z.string(),
  type: z.string(),
});

export const brasilApiHolidaysRawSchema = z.array(brasilApiHolidayRawSchema);

export type BrasilApiHolidayRaw = z.infer<typeof brasilApiHolidayRawSchema>;
