import { providers } from '../config/providers';
import type { CnpjResponse } from '../schemas/cnpj.schema';
import { brasilApiCnpjRawSchema } from '../schemas/cnpj.schema';
import { NotFoundError, UpstreamError } from '../utils/errors';
import { fetchJson } from '../utils/httpClient';

export async function getCompanyByCnpj(cnpj: string): Promise<CnpjResponse> {
  const url = `${providers.brasilApi.baseUrl}/cnpj/v1/${cnpj}`;
  const raw = await fetchJson<unknown>(url, {
    providerName: providers.brasilApi.name,
    treatAsNotFound: [404],
  });

  if (raw === null) throw new NotFoundError(`No company found for CNPJ ${cnpj}.`);

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
}
