import { env } from '../config/env';
import { UpstreamError, UpstreamTimeoutError } from '../utils/errors';

export interface ManagedProvider<T, TInput> {
  readonly name: string;
  execute(input: TInput): Promise<T | null>;
}

interface ProviderState {
  failures: number;
  openedAt: number | null;
  halfOpenProbe: boolean;
  successes: number;
  errors: number;
  totalLatencyMs: number;
}

export interface ProviderStats {
  name: string;
  failures: number;
  successes: number;
  errors: number;
  averageLatencyMs: number;
  circuitOpen: boolean;
  circuitHalfOpen: boolean;
}

export class ProviderManager<T, TInput> {
  private readonly states = new Map<string, ProviderState>();

  constructor(private readonly providers: ManagedProvider<T, TInput>[]) {
    if (providers.length === 0) throw new Error('At least one provider is required.');
    for (const provider of providers) {
      this.states.set(provider.name, { failures: 0, openedAt: null, halfOpenProbe: false, successes: 0, errors: 0, totalLatencyMs: 0 });
    }
  }

  async execute(input: TInput): Promise<{ value: T | null; provider: string }> {
    let lastError: unknown;
    for (const provider of this.providers) {
      const state = this.states.get(provider.name)!;
      if (!this.tryAcquire(state)) continue;
      const started = Date.now();
      try {
        const value = await provider.execute(input);
        state.totalLatencyMs += Date.now() - started;
        state.successes += 1;
        state.failures = 0;
        state.openedAt = null;
        state.halfOpenProbe = false;
        return { value, provider: provider.name };
      } catch (error) {
        state.totalLatencyMs += Date.now() - started;
        state.errors += 1;
        if (!(error instanceof UpstreamError) && !(error instanceof UpstreamTimeoutError)) {
          state.halfOpenProbe = false;
          throw error;
        }
        state.failures += 1;
        state.openedAt = Date.now();
        state.halfOpenProbe = false;
        lastError = error;
      }
    }
    throw lastError ?? new UpstreamError('All upstream providers are temporarily unavailable.');
  }

  getStats(): ProviderStats[] {
    return this.providers.map(({ name }) => {
      const state = this.states.get(name)!;
      const attempts = state.successes + state.errors;
      return {
        name,
        failures: state.failures,
        successes: state.successes,
        errors: state.errors,
        averageLatencyMs: attempts === 0 ? 0 : Number((state.totalLatencyMs / attempts).toFixed(2)),
        circuitOpen: this.isCircuitOpen(state),
        circuitHalfOpen: state.halfOpenProbe,
      };
    });
  }

  private tryAcquire(state: ProviderState): boolean {
    if (state.openedAt === null) return true;
    if (Date.now() - state.openedAt < env.PROVIDER_COOLDOWN_MS) return false;
    if (state.halfOpenProbe) return false;
    state.halfOpenProbe = true;
    return true;
  }

  private isCircuitOpen(state: ProviderState): boolean {
    return state.openedAt !== null && !state.halfOpenProbe && Date.now() - state.openedAt < env.PROVIDER_COOLDOWN_MS;
  }
}
