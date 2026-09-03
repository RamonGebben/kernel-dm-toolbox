import { describe, expect, it } from 'vitest';
import { toConnectionStatus } from '~/organisms/ConnectionStatus/hooks/useConnectionStatus';

describe('toConnectionStatus', () => {
  const checkedAt = new Date('2026-01-01T12:00:00.000Z');
  const data = {
    message: 'ping',
    campaignName: 'Curse of Strahd',
    checkedAt,
  };

  it('reports pending before anything else', () => {
    // Even with data already in cache, a pending refetch wins the guard order.
    expect(toConnectionStatus({ isPending: true, error: null, data })).toEqual({
      state: 'pending',
    });
  });

  it('surfaces the error message when the query failed', () => {
    const status = toConnectionStatus({
      isPending: false,
      error: { message: 'Failed to fetch' },
      data: undefined,
    });

    expect(status).toEqual({ state: 'error', reason: 'Failed to fetch' });
  });

  it('treats a resolved query with no data as an error', () => {
    const status = toConnectionStatus({
      isPending: false,
      error: null,
      data: undefined,
    });

    expect(status.state).toBe('error');
  });

  it('maps a successful ping onto the connected state', () => {
    expect(toConnectionStatus({ isPending: false, error: null, data })).toEqual(
      {
        state: 'connected',
        message: 'ping',
        campaignName: 'Curse of Strahd',
        checkedAt,
      },
    );
  });
});
