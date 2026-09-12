import { z } from 'zod';

const UF_REGEX = /^[A-Za-z]{2}$/;

export const ufParamSchema = z.object({
  uf: z
    .string()
    .regex(UF_REGEX, { message: 'UF must be a 2-letter Brazilian state code, e.g. "AM".' })
    .transform((value) => value.toUpperCase()),
});

export type UfParam = z.infer<typeof ufParamSchema>;

export const stateResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  stateCode: z.string(),
  region: z.string(),
});

export type StateResponse = z.infer<typeof stateResponseSchema>;

export const cityResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  stateCode: z.string(),
});

export type CityResponse = z.infer<typeof cityResponseSchema>;

/** Raw shape returned by the IBGE localidades API for /estados. */
export const ibgeStateRawSchema = z.object({
  id: z.number(),
  sigla: z.string(),
  nome: z.string(),
  regiao: z.object({
    id: z.number(),
    sigla: z.string(),
    nome: z.string(),
  }),
});

export type IbgeStateRaw = z.infer<typeof ibgeStateRawSchema>;

/** Raw shape returned by the IBGE localidades API for /estados/{uf}/municipios. */
export const ibgeCityRawSchema = z.object({
  id: z.number(),
  nome: z.string(),
});

export type IbgeCityRaw = z.infer<typeof ibgeCityRawSchema>;
