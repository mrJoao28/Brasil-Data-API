import { z } from 'zod';
import { cepResponseSchema } from './cep.schema';
import { cnpjResponseSchema } from './cnpj.schema';
import { stateResponseSchema } from './location.schema';

/**
 * Aggregated CNPJ + CEP + state response. `address` and `state` are
 * nullable: the primary CNPJ lookup is required (a failure there fails the
 * whole request), but the two secondary enrichment lookups are best-effort
 * — see empresaCompleta.service.ts for the full rationale. `warnings`
 * explains any secondary lookup that was skipped or failed.
 */
export const empresaCompletaResponseSchema = z.object({
  company: cnpjResponseSchema,
  address: cepResponseSchema.nullable(),
  state: stateResponseSchema.nullable(),
  warnings: z.array(z.string()),
});

export type EmpresaCompletaResponse = z.infer<typeof empresaCompletaResponseSchema>;
