import { z } from 'zod';

export const cnpjParamSchema = z.object({
  cnpj: z.string().transform((value) => value.replace(/\D/g, '')).refine((value) => value.length === 14, {
    message: 'CNPJ must contain 14 digits.',
  }),
});

export type CnpjParam = z.infer<typeof cnpjParamSchema>;

export const secondaryActivitySchema = z.object({
  code: z.number(),
  description: z.string(),
});

export const cnpjResponseSchema = z.object({
  cnpj: z.string(),
  legalName: z.string(),
  tradeName: z.string().nullable(),
  status: z.string(),
  openedAt: z.string().nullable(),
  mainActivity: z.string().nullable(),
  mainActivityCode: z.number().nullable(),
  secondaryActivities: z.array(secondaryActivitySchema),
  legalNature: z.string().nullable(),
  companySize: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  cep: z.string().nullable(),
  street: z.string().nullable(),
  number: z.string().nullable(),
  neighborhood: z.string().nullable(),
  complement: z.string().nullable(),
});

export type CnpjResponse = z.infer<typeof cnpjResponseSchema>;

export const brasilApiCnpjRawSchema = z.object({
  cnpj: z.string(),
  razao_social: z.string(),
  nome_fantasia: z.string().nullable().optional(),
  descricao_situacao_cadastral: z.string().nullable().optional(),
  data_inicio_atividade: z.string().nullable().optional(),
  cnae_fiscal_descricao: z.string().nullable().optional(),
  cnae_fiscal: z.number().nullable().optional(),
  cnaes_secundarios: z.array(z.object({ codigo: z.number(), descricao: z.string() })).optional().default([]),
  natureza_juridica: z.string().nullable().optional(),
  porte: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),
  cep: z.string().nullable().optional(),
  logradouro: z.string().nullable().optional(),
  numero: z.string().nullable().optional(),
  bairro: z.string().nullable().optional(),
  complemento: z.string().nullable().optional(),
});

export type BrasilApiCnpjRaw = z.infer<typeof brasilApiCnpjRawSchema>;
