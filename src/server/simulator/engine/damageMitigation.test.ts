import { describe, expect, it } from 'vitest';
import { mitigateDamage } from '~/server/simulator/engine/damageMitigation';

const target = (overrides: {
  damageImmunities?: string[];
  damageResistances?: string[];
  damageVulnerabilities?: string[];
}) => ({
  damageImmunities: overrides.damageImmunities ?? [],
  damageResistances: overrides.damageResistances ?? [],
  damageVulnerabilities: overrides.damageVulnerabilities ?? [],
});

describe('mitigateDamage', () => {
  it('returns the damage unchanged when the type matches nothing', () => {
    expect(mitigateDamage(10, 'fire', target({}))).toBe(10);
  });

  it('returns the damage unchanged for an untyped effect', () => {
    expect(
      mitigateDamage(10, null, target({ damageImmunities: ['fire'] })),
    ).toBe(10);
  });

  it('zeroes damage of an immune type', () => {
    expect(
      mitigateDamage(10, 'fire', target({ damageImmunities: ['fire'] })),
    ).toBe(0);
  });

  it('halves and rounds down damage of a resisted type', () => {
    expect(
      mitigateDamage(9, 'cold', target({ damageResistances: ['cold'] })),
    ).toBe(4);
  });

  it('doubles damage of a vulnerable type', () => {
    expect(
      mitigateDamage(
        6,
        'poison',
        target({ damageVulnerabilities: ['poison'] }),
      ),
    ).toBe(12);
  });

  it('compares case-insensitively', () => {
    expect(
      mitigateDamage(10, 'Fire', target({ damageImmunities: ['fire'] })),
    ).toBe(0);
  });

  it('prioritizes immunity over resistance/vulnerability if a type somehow appears in more than one list', () => {
    expect(
      mitigateDamage(
        10,
        'fire',
        target({ damageImmunities: ['fire'], damageVulnerabilities: ['fire'] }),
      ),
    ).toBe(0);
  });
});
