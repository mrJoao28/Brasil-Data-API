import { z } from 'zod';

/**
 * A valid Brazilian CEP has exactly 8 digits. Input may arrive with a
 * hyphen (e.g. "69000-000") or other formatting, which is stripped before
 * validation so callers can send either form.
 */
export const cepParamSchema = z.object({
  cep: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => value.length === 8, {
      message: 'CEP must contain 8 digits.',
    }),
});

export type CepParam = z.infer<typeof cepParamSchema>;

export const cepResponseSchema = z.object({
  cep: z.string(),
  street: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  stateCode: z.string(),
});

export type CepResponse = z.infer<typeof cepResponseSchema>;

/**
 * Shape returned by the ViaCEP provider. `erro` is present (as boolean
 * `true`) when the CEP is well-formed but not found in their database.
 */
export const viaCepRawSchema = z.object({
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  localidade: z.string().optional(),
  uf: z.string().optional(),
  erro: z.boolean().optional(),
});

export type ViaCepRaw = z.infer<typeof viaCepRawSchema>;
