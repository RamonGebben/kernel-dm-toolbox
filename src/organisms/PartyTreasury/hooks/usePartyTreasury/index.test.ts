import { describe, expect, it } from 'vitest';
import { canMoveGold } from '~/organisms/PartyTreasury/hooks/usePartyTreasury';

describe('canMoveGold', () => {
  it('allows any positive deposit', () => {
    expect(canMoveGold(0, 500, 'deposit')).toBe(true);
  });

  it('allows withdrawing up to the balance', () => {
    expect(canMoveGold(100, 100, 'withdraw')).toBe(true);
  });

  it('refuses to withdraw more than the treasury holds', () => {
    expect(canMoveGold(100, 101, 'withdraw')).toBe(false);
  });

  it('refuses zero, negative and fractional amounts', () => {
    expect(canMoveGold(100, 0, 'deposit')).toBe(false);
    expect(canMoveGold(100, -5, 'deposit')).toBe(false);
    expect(canMoveGold(100, 2.5, 'deposit')).toBe(false);
  });
});
