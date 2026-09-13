import type { CepResponse } from '../schemas/cep.schema';

/**
 * A CEP provider knows how to turn a normalized 8-digit CEP into an
 * address in our consistent response shape. It is responsible for its
 * own upstream request, timeout and payload-shape validation; callers
 * (the CEP service) only deal with this interface, never with a
 * specific vendor's HTTP client or payload format.
 *
 * Returning `null` means "well-formed CEP, no address on file" (the
 * service turns that into a 404 NotFoundError). Throwing UpstreamError /
 * UpstreamTimeoutError (see utils/errors.ts) is how a provider reports a
 * failure of the upstream dependency itself.
 */
export interface CepProvider {
  readonly name: string;
  getAddressByCep(cep: string): Promise<CepResponse | null>;
}
