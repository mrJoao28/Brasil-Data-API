import { afterEach, describe, expect, it, vi } from 'vitest';
import { listHolidaysByYear } from '../../src/services/holidays.service';
import { NotFoundError } from '../../src/utils/errors';

function mockFetchOnce(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
    }),
  );
}

describe('holidays.service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps BrasilAPI holidays payload to the consistent shape', async () => {
    mockFetchOnce([{ date: '2026-01-01', name: 'Confraternização mundial', type: 'national' }]);

    const result = await listHolidaysByYear(2026);

    expect(result).toEqual([
      { date: '2026-01-01', name: 'Confraternização mundial', type: 'national' },
    ]);
  });

  it('throws NotFoundError when BrasilAPI responds 404', async () => {
    mockFetchOnce({}, 404);

    await expect(listHolidaysByYear(1500)).rejects.toBeInstanceOf(NotFoundError);
  });
});
