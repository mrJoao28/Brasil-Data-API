import { z } from 'zod';

export const cnpjParamSchema = z.object({
  cnpj: z
    .string()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => value.length === 14, {
      message: 'CNPJ must contain 14 digits.',
    }),
});

export type CnpjParam = z.infer<typeof cnpjParamSchema>;

export const cnpjResponseSchema = z.object({
  cnpj: z.string(),
  legalName: z.string(),
  tradeName: z.string().nullable(),
  status: z.string(),
  openedAt: z.string().nullable(),
  mainActivity: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  cep: z.string().nullable(),
});

export type CnpjResponse = z.infer<typeof cnpjResponseSchema>;

/**
 * Raw shape (subset) returned by BrasilAPI's /cnpj/v1/{cnpj} endpoint,
 * which itself aggregates official Receita Federal (Minha Receita) data.
 * Only the fields we map into our consistent response are declared here.
 */
export const brasilApiCnpjRawSchema = z.object({
  cnpj: z.string(),
  razao_social: z.string(),
  nome_fantasia: z.string().nullable().optional(),
  descricao_situacao_cadastral: z.string().nullable().optional(),
  data_inicio_atividade: z.string().nullable().optional(),
  cnae_fiscal_descricao: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),
  cep: z.string().nullable().optional(),
});

export type BrasilApiCnpjRaw = z.infer<typeof brasilApiCnpjRawSchema>;
