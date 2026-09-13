import type { EmpresaCompletaResponse } from '../schemas/empresaCompleta.schema';
import { isApiError } from '../utils/errors';
import { getAddressByCep } from './cep.service';
import { getCompanyByCnpj } from './cnpj.service';
import { getStateByCode } from './location.service';

function describeError(error: unknown): string {
  return isApiError(error) ? error.message : 'unexpected error';
}

/**
 * Aggregates three existing services into a single response for a CNPJ:
 * the company record itself, the full address for the company's CEP, and
 * the full name of the company's state (UF).
 *
 * Failure policy (also documented in README.md / docs/openapi.yaml):
 * - The CNPJ lookup is the primary, required call. If it fails (not
 *   found, upstream error/timeout), that error propagates and fails the
 *   whole request — identical to calling `/cnpj/:cnpj` directly.
 * - The CEP and state lookups are secondary, best-effort enrichments
 *   derived from the company record. Each is attempted independently and
 *   wrapped in its own try/catch: if a lookup fails, or the company
 *   record simply doesn't have a CEP/UF on file, that section of the
 *   response is `null` and a human-readable entry is added to
 *   `warnings` instead of failing the entire request.
 *
 * This "required primary, best-effort secondary" split was chosen over an
 * all-or-nothing approach because it is simpler to reason about and
 * maintain (one clear rule, not a per-field failure matrix), and because
 * it keeps the endpoint useful when a downstream secondary provider
 * (ViaCEP or IBGE) has a partial outage — the caller still gets the
 * company data they asked for, with a clear note about what's missing.
 */
export async function getEmpresaCompleta(cnpj: string): Promise<EmpresaCompletaResponse> {
  const company = await getCompanyByCnpj(cnpj);

  const warnings: string[] = [];

  let address: EmpresaCompletaResponse['address'] = null;
  if (company.cep) {
    try {
      address = await getAddressByCep(company.cep);
    } catch (error) {
      warnings.push(`Could not resolve address for CEP ${company.cep}: ${describeError(error)}`);
    }
  } else {
    warnings.push('Company record has no CEP on file; address lookup skipped.');
  }

  let state: EmpresaCompletaResponse['state'] = null;
  if (company.state) {
    try {
      state = await getStateByCode(company.state);
    } catch (error) {
      warnings.push(`Could not resolve state for UF ${company.state}: ${describeError(error)}`);
    }
  } else {
    warnings.push('Company record has no UF on file; state lookup skipped.');
  }

  return { company, address, state, warnings };
}
