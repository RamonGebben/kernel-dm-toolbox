import { describe, expect, it } from 'vitest';
import {
  latestErrorMessage,
  toBastionDetailState,
} from '~/organisms/BastionDetail/hooks/useBastionDetail';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';

const detail = { id: 'b1' } as BastionDetail;

describe('toBastionDetailState', () => {
  it('waits for the list first', () => {
    expect(toBastionDetailState(true, null, undefined)).toEqual({
      kind: 'pending',
    });
  });

  it('has nothing to show when no bastion exists', () => {
    expect(toBastionDetailState(false, null, undefined)).toEqual({
      kind: 'none',
    });
  });

  it('waits for the selected bastion to load', () => {
    expect(toBastionDetailState(false, 'b1', undefined)).toEqual({
      kind: 'pending',
    });
  });

  it('does not show the previous bastion while switching', () => {
    expect(toBastionDetailState(false, 'b2', detail)).toEqual({
      kind: 'pending',
    });
  });

  it('shows the loaded bastion', () => {
    expect(toBastionDetailState(false, 'b1', detail)).toEqual({
      kind: 'loaded',
      detail,
    });
  });
});

describe('latestErrorMessage', () => {
  it('is null when nothing failed', () => {
    expect(latestErrorMessage([{ error: null, submittedAt: 1 }])).toBeNull();
  });

  it('reports the most recent failure', () => {
    expect(
      latestErrorMessage([
        { error: { message: 'old' }, submittedAt: 1 },
        { error: null, submittedAt: 5 },
        { error: { message: 'new' }, submittedAt: 3 },
      ]),
    ).toBe('new');
  });
});
