import type { CnpjResponse } from '../schemas/cnpj.schema';

/**
 * A CNPJ provider knows how to turn a normalized 14-digit CNPJ into
 * company registration data in our consistent response shape. Same
 * contract as `CepProvider`: `null` means "not found" (service throws
 * NotFoundError), upstream failures are reported via the existing
 * UpstreamError / UpstreamTimeoutError types.
 */
export interface CnpjProvider {
  readonly name: string;
  getCompanyByCnpj(cnpj: string): Promise<CnpjResponse | null>;
}
