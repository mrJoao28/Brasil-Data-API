import { env } from '../config/env';
import type { CnpjResponse } from '../schemas/cnpj.schema';
import { brasilApiCnpjRawSchema } from '../schemas/cnpj.schema';
import { UpstreamError } from '../utils/errors';
import { fetchJson } from '../utils/httpClient';
import type { CnpjProvider } from './cnpjProvider';

/**
 * BrasilAPI-backed implementation of `CnpjProvider`. BrasilAPI itself
 * aggregates/re-serves Receita Federal's own public CNPJ dataset.
 *
 * Licensing note (see docs/PROVIDERS.md): the underlying Receita Federal
 * CNPJ dataset is published as open data, but BrasilAPI (the community
 * project sitting in front of it) does not publish a written commercial
 * redistribution license or an SLA. That is a materially different
 * situation from "confirmed OK for a paid RapidAPI tier." Treat this
 * provider as suitable for the current free/MVP tier; before shipping a
 * paid commercial tier, either get RFB's official "Consulta CNPJ" API
 * credentials via gov.br/conecta (OAuth2 client — needs registration
 * this environment doesn't have) or a vendor whose ToS explicitly
 * covers commercial resale.
 */
export const brasilApiCnpjProvider: CnpjProvider = {
  name: 'BrasilAPI',

  async getCompanyByCnpj(cnpj: string): Promise<CnpjResponse | null> {
    const url = `${env.BRASILAPI_BASE_URL}/cnpj/v1/${cnpj}`;
    const raw = await fetchJson<unknown>(url, {
      providerName: 'BrasilAPI',
      treatAsNotFound: [404],
    });

    if (raw === null) return null;

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
      mainActivityCode: data.cnae_fiscal ?? null,
      secondaryActivities: data.cnaes_secundarios.map((activity) => ({
        code: activity.codigo,
        description: activity.descricao,
      })),
      legalNature: data.natureza_juridica ?? null,
      companySize: data.porte ?? null,
      city: data.municipio ?? null,
      state: data.uf ?? null,
      cep: data.cep?.replace(/\D/g, '') ?? null,
      street: data.logradouro ?? null,
      number: data.numero ?? null,
      neighborhood: data.bairro ?? null,
      complement: data.complemento ?? null,
    };
  },
};
