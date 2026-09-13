import { env } from '../config/env';
import type { CepProvider } from './cepProvider';
import { viaCepProvider } from './viaCepProvider';

/**
 * Resolves the active CEP provider from `CEP_PROVIDER`. Only 'viacep' is
 * implemented today. 'correios' is a documented extension point (see
 * docs/PROVIDERS.md) for when a licensed SIGEP Web contract is in place —
 * selecting it now fails fast with an explicit configuration error
 * instead of silently falling back to ViaCEP or throwing an opaque
 * "undefined is not a function" further down the stack.
 */
export function getCepProvider(): CepProvider {
  switch (env.CEP_PROVIDER) {
    case 'viacep':
      return viaCepProvider;
    case 'correios':
      throw new Error(
        'CEP_PROVIDER=correios is not implemented yet. It requires a SIGEP Web contract/credentials with Correios. See docs/PROVIDERS.md before configuring this in any environment.',
      );
    default: {
      const exhaustiveCheck: never = env.CEP_PROVIDER;
      throw new Error(`Unknown CEP_PROVIDER: ${String(exhaustiveCheck)}`);
    }
  }
}
