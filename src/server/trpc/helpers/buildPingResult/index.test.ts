import { describe, expect, it } from 'vitest';
import { buildPingResult } from '~/server/trpc/helpers/buildPingResult';

describe('buildPingResult', () => {
  const now = new Date('2026-01-01T12:00:00.000Z');

  it('echoes the caller message back', () => {
    const result = buildPingResult({
      input: { message: 'hello' },
      campaignName: 'Curse of Strahd',
      now,
    });

    expect(result.message).toBe('hello');
  });

  it('reports the campaign the instance is serving', () => {
    const result = buildPingResult({
      input: { message: 'ping' },
      campaignName: 'Curse of Strahd',
      now,
    });

    expect(result.campaignName).toBe('Curse of Strahd');
  });

  it('stamps the time it was given rather than reading the clock', () => {
    const result = buildPingResult({
      input: { message: 'ping' },
      campaignName: 'Curse of Strahd',
      now,
    });

    expect(result.checkedAt).toEqual(now);
  });
});
