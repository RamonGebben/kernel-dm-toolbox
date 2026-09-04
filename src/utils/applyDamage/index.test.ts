import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  applyHealing,
  applyTemporaryHitPoints,
  toHealthStatus,
  toHitPointTone,
} from '~/utils/applyDamage';

const hitPoints = {
  currentHitPoints: 52,
  temporaryHitPoints: 0,
  maxHitPoints: 52,
};

describe('applyDamage', () => {
  it('subtracts from current hit points', () => {
    expect(applyDamage(hitPoints, 17).currentHitPoints).toBe(35);
  });

  it('floors at zero rather than going negative', () => {
    expect(applyDamage(hitPoints, 200).currentHitPoints).toBe(0);
  });

  it('spends temporary hit points before real ones', () => {
    const withTemp = { ...hitPoints, temporaryHitPoints: 10 };

    expect(applyDamage(withTemp, 6)).toMatchObject({
      temporaryHitPoints: 4,
      currentHitPoints: 52,
    });
  });

  it('carries damage past exhausted temporary hit points', () => {
    const withTemp = { ...hitPoints, temporaryHitPoints: 10 };

    expect(applyDamage(withTemp, 15)).toMatchObject({
      temporaryHitPoints: 0,
      currentHitPoints: 47,
    });
  });

  it('ignores zero and negative damage', () => {
    expect(applyDamage(hitPoints, 0)).toEqual(hitPoints);
    expect(applyDamage(hitPoints, -5)).toEqual(hitPoints);
  });

  it('does not mutate its input', () => {
    const input = { ...hitPoints };
    applyDamage(input, 10);

    expect(input.currentHitPoints).toBe(52);
  });
});

describe('applyHealing', () => {
  it('restores hit points', () => {
    const hurt = { ...hitPoints, currentHitPoints: 20 };

    expect(applyHealing(hurt, 10).currentHitPoints).toBe(30);
  });

  it('never exceeds the maximum', () => {
    const hurt = { ...hitPoints, currentHitPoints: 50 };

    expect(applyHealing(hurt, 100).currentHitPoints).toBe(52);
  });

  it('does not restore temporary hit points', () => {
    const spent = { ...hitPoints, currentHitPoints: 20, temporaryHitPoints: 0 };

    expect(applyHealing(spent, 10).temporaryHitPoints).toBe(0);
  });

  it('can bring a downed creature back up', () => {
    const downed = { ...hitPoints, currentHitPoints: 0 };

    expect(applyHealing(downed, 1).currentHitPoints).toBe(1);
  });
});

describe('applyTemporaryHitPoints', () => {
  it('takes the larger pool rather than stacking', () => {
    const withTemp = { ...hitPoints, temporaryHitPoints: 10 };

    expect(applyTemporaryHitPoints(withTemp, 6).temporaryHitPoints).toBe(10);
    expect(applyTemporaryHitPoints(withTemp, 14).temporaryHitPoints).toBe(14);
  });

  it('never goes negative', () => {
    expect(applyTemporaryHitPoints(hitPoints, -5).temporaryHitPoints).toBe(0);
  });
});

describe('toHealthStatus', () => {
  it('is healthy above half', () => {
    expect(toHealthStatus({ currentHitPoints: 30, maxHitPoints: 52 })).toBe(
      'healthy',
    );
  });

  it('is bloodied at exactly half', () => {
    expect(toHealthStatus({ currentHitPoints: 26, maxHitPoints: 52 })).toBe(
      'bloodied',
    );
  });

  it('is unconscious at zero', () => {
    expect(toHealthStatus({ currentHitPoints: 0, maxHitPoints: 52 })).toBe(
      'unconscious',
    );
  });

  it('does not divide by zero on a maxless combatant', () => {
    expect(toHealthStatus({ currentHitPoints: 5, maxHitPoints: 0 })).toBe(
      'healthy',
    );
  });
});

describe('toHitPointTone', () => {
  it('is full at maximum', () => {
    expect(toHitPointTone({ currentHitPoints: 45, maxHitPoints: 45 })).toBe(
      'full',
    );
  });

  it('is damaged one point below maximum, unlike bloodied', () => {
    expect(toHitPointTone({ currentHitPoints: 44, maxHitPoints: 45 })).toBe(
      'damaged',
    );
  });

  it('is down at zero', () => {
    expect(toHitPointTone({ currentHitPoints: 0, maxHitPoints: 127 })).toBe(
      'down',
    );
  });

  it('treats an over-healed combatant as full', () => {
    expect(toHitPointTone({ currentHitPoints: 60, maxHitPoints: 45 })).toBe(
      'full',
    );
  });
});
