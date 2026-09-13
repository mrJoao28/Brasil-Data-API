import { env } from '../config/env';
import type { CnpjResponse } from '../schemas/cnpj.schema';
import { openCnpjRawSchema } from '../schemas/cnpj.schema';
import { fetchJson } from '../utils/httpClient';
import type { CnpjProvider } from './cnpjProvider';

/**
 * OpenCNPJ is a free, unauthenticated API that republishes public CNPJ data
 * from public government datasets. It is used as a resilience fallback for
 * the free tier; it is not presented as an SLA or as a legal grant to resell
 * upstream data.
 */
export const openCnpjProvider: CnpjProvider = {
  name: 'OpenCNPJ',

  async getCompanyByCnpj(cnpj: string): Promise<CnpjResponse | null> {
    const url = `${env.OPENCNPJ_BASE_URL}/${cnpj}`;
    const raw = await fetchJson<unknown>(url, {
      providerName: 'OpenCNPJ',
      treatAsNotFound: [404],
    });

    if (raw === null) return null;

    const parsed = openCnpjRawSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error('OpenCNPJ returned an unexpected payload shape.');
    }

    const data = parsed.data;
    const mainActivityCode = Number(data.cnae_principal);

    return {
      cnpj: data.cnpj,
      legalName: data.razao_social,
      tradeName: data.nome_fantasia ?? null,
      status: data.situacao_cadastral ?? 'UNKNOWN',
      openedAt: data.data_inicio_atividade ?? null,
      mainActivity: null,
      mainActivityCode: Number.isFinite(mainActivityCode) ? mainActivityCode : null,
      secondaryActivities: [],
      legalNature: data.natureza_juridica ?? null,
      companySize: data.porte_empresa ?? null,
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
