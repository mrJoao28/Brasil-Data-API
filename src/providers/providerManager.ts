import { env } from '../config/env';
import { UpstreamError, UpstreamTimeoutError } from '../utils/errors';

export interface ManagedProvider<T, TInput> {
  readonly name: string;
  execute(input: TInput): Promise<T | null>;
}

interface ProviderState {
  failures: number;
  openedAt: number | null;
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
}

export class ProviderManager<T, TInput> {
  private readonly states = new Map<string, ProviderState>();

  constructor(private readonly providers: ManagedProvider<T, TInput>[]) {
    if (providers.length === 0) throw new Error('At least one provider is required.');
    for (const provider of providers) {
      this.states.set(provider.name, { failures: 0, openedAt: null, successes: 0, errors: 0, totalLatencyMs: 0 });
    }
  }

  async execute(input: TInput): Promise<{ value: T | null; provider: string }> {
    let lastError: unknown;
    for (const provider of this.providers) {
      const state = this.states.get(provider.name)!;
      if (this.isCircuitOpen(state)) continue;
      const started = Date.now();
      try {
        const value = await provider.execute(input);
        state.totalLatencyMs += Date.now() - started;
        state.successes += 1;
        state.failures = 0;
        state.openedAt = null;
        return { value, provider: provider.name };
      } catch (error) {
        state.totalLatencyMs += Date.now() - started;
        state.errors += 1;
        if (!(error instanceof UpstreamError) && !(error instanceof UpstreamTimeoutError)) throw error;
        state.failures += 1;
        if (state.failures >= env.PROVIDER_FAILURE_THRESHOLD) state.openedAt = Date.now();
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
      };
    });
  }

  private isCircuitOpen(state: ProviderState): boolean {
    return state.openedAt !== null && Date.now() - state.openedAt < env.PROVIDER_COOLDOWN_MS;
  }
}
