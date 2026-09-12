import { providers } from '../config/providers';
import type { CnpjResponse } from '../schemas/cnpj.schema';
import { brasilApiCnpjRawSchema } from '../schemas/cnpj.schema';
import { NotFoundError, UpstreamError } from '../utils/errors';
import { fetchJson } from '../utils/httpClient';

/**
 * Provider note: BrasilAPI's /cnpj/v1 endpoint aggregates data sourced
 * from the Receita Federal (via the open-source "Minha Receita" project)
 * and is free to use without an API key. See README.md for the full
 * licensing/rate-limit rationale before relying on this in production.
 */
export async function getCompanyByCnpj(cnpj: string): Promise<CnpjResponse> {
  const url = `${providers.brasilApi.baseUrl}/cnpj/v1/${cnpj}`;

  const raw = await fetchJson<unknown>(url, {
    providerName: providers.brasilApi.name,
    treatAsNotFound: [404],
  });

  if (raw === null) {
    throw new NotFoundError(`No company found for CNPJ ${cnpj}.`);
  }

  const parsed = brasilApiCnpjRawSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UpstreamError('BrasilAPI returned an unexpected payload shape.', {
      issues: parsed.error.issues,
    });
  }

  const data = parsed.data;

  return {
    cnpj: data.cnpj,
    legalName: data.razao_social,
    tradeName: data.nome_fantasia ?? null,
    status: data.descricao_situacao_cadastral ?? 'UNKNOWN',
    openedAt: data.data_inicio_atividade ?? null,
    mainActivity: data.cnae_fiscal_descricao ?? null,
    city: data.municipio ?? null,
    state: data.uf ?? null,
  };
}
