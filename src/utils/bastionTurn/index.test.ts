import { describe, expect, it } from 'vitest';
import {
  armoryStockCost,
  attackDice,
  attackLosses,
  countDefenders,
  eventForRoll,
  guestForRoll,
  orderLimit,
  requestForAidOutcome,
  resolveEventOutcome,
  storehouseBuyLimit,
  storehouseSalePrice,
  suggestedRecruits,
  treasureForRoll,
} from '~/utils/bastionTurn';

describe('countDefenders', () => {
  it('counts one in the singular and anything else in the plural', () => {
    expect(countDefenders(1)).toBe('1 defender');
    expect(countDefenders(0)).toBe('0 defenders');
    expect(countDefenders(3)).toBe('3 defenders');
  });
});

describe('eventForRoll', () => {
  it.each([
    [1, 'all-is-well'],
    [50, 'all-is-well'],
    [51, 'attack'],
    [58, 'criminal-hireling'],
    [63, 'extraordinary-opportunity'],
    [72, 'friendly-visitors'],
    [76, 'guest'],
    [79, 'lost-hirelings'],
    [83, 'magical-discovery'],
    [91, 'refugees'],
    [98, 'request-for-aid'],
    [100, 'treasure'],
  ])('a roll of %i is %s', (roll, key) => {
    expect(eventForRoll(roll).key).toBe(key);
  });
});

describe('treasureForRoll', () => {
  it('reads the treasure table', () => {
    expect(treasureForRoll(40)).toMatch(/25 GP/);
    expect(treasureForRoll(99)).toMatch(/Rare/);
  });
});

describe('guestForRoll', () => {
  it('reads the guest table', () => {
    expect(guestForRoll(3).key).toBe('mercenary');
  });
});

describe('attackDice', () => {
  it('rolls six d6 by default', () => {
    expect(
      attackDice({ isFullyEnclosed: false, isArmoryStocked: false }),
    ).toEqual({ count: 6, sides: 6 });
  });

  it('rolls two fewer behind full walls, d8s with a stocked Armory', () => {
    expect(
      attackDice({ isFullyEnclosed: true, isArmoryStocked: true }),
    ).toEqual({ count: 4, sides: 8 });
  });

  it('drops a die per lieutenant, never below none', () => {
    expect(
      attackDice({
        isFullyEnclosed: true,
        isArmoryStocked: false,
        lieutenants: 10,
      }).count,
    ).toBe(0);
  });
});

describe('attackLosses', () => {
  it('kills one defender per 1 rolled', () => {
    expect(
      attackLosses({ ones: 2, defenders: 8, hasGuestMonster: false }),
    ).toBe(2);
  });

  it('cannot kill more defenders than there are', () => {
    expect(
      attackLosses({ ones: 3, defenders: 1, hasGuestMonster: false }),
    ).toBe(1);
  });

  it('kills nobody while a friendly monster stays', () => {
    expect(attackLosses({ ones: 4, defenders: 8, hasGuestMonster: true })).toBe(
      0,
    );
  });
});

describe('requestForAidOutcome', () => {
  it('pays in full for 10 or more', () => {
    expect(requestForAidOutcome({ total: 12, rewardRoll: 3 })).toEqual({
      goldGained: 300,
      defendersLost: 0,
    });
  });

  it('pays half and costs a defender for less', () => {
    expect(requestForAidOutcome({ total: 7, rewardRoll: 3 })).toEqual({
      goldGained: 150,
      defendersLost: 1,
    });
  });
});

describe('resolveEventOutcome', () => {
  const bastion = { defenderCount: 5, hasGuestMonster: false };

  it('counts an Attack in dead defenders', () => {
    expect(resolveEventOutcome('attack', { ones: 2 }, bastion)).toMatchObject({
      defendersLost: 2,
    });
  });

  it('charges a bribe only if it is paid', () => {
    expect(
      resolveEventOutcome(
        'criminal-hireling',
        { bribeRoll: 4, pay: 1 },
        bastion,
      ).goldPaid,
    ).toBe(400);
    expect(
      resolveEventOutcome(
        'criminal-hireling',
        { bribeRoll: 4, pay: 0 },
        bastion,
      ).goldPaid,
    ).toBe(0);
  });

  it('charges 500 GP for an accepted opportunity', () => {
    expect(
      resolveEventOutcome('extraordinary-opportunity', { accept: 1 }, bastion)
        .goldPaid,
    ).toBe(500);
  });

  it('pays out friendly visitors and refugees by the d6', () => {
    expect(
      resolveEventOutcome('friendly-visitors', { roll: 3 }, bastion).goldGained,
    ).toBe(300);
    expect(
      resolveEventOutcome('refugees', { payRoll: 6 }, bastion).goldGained,
    ).toBe(600);
  });

  it('ignores a die result that cannot be on that die', () => {
    expect(
      resolveEventOutcome('friendly-visitors', { roll: 9 }, bastion).goldGained,
    ).toBe(0);
  });

  it('reads each kind of guest', () => {
    expect(
      resolveEventOutcome('guest', { kindRoll: 2, giftRoll: 5 }, bastion),
    ).toMatchObject({ guestKind: 'sanctuary', goldGained: 500 });
    expect(
      resolveEventOutcome('guest', { kindRoll: 3 }, bastion),
    ).toMatchObject({
      guestKind: 'mercenary',
      defendersGained: 1,
    });
    expect(
      resolveEventOutcome('guest', { kindRoll: 4 }, bastion).guestKind,
    ).toBe('monster');
  });

  it('settles a request for aid only once the help is sent and rewarded', () => {
    expect(
      resolveEventOutcome('request-for-aid', { help: 0 }, bastion),
    ).toMatchObject({ goldGained: 0, defendersLost: 0 });
    expect(
      resolveEventOutcome(
        'request-for-aid',
        { help: 1, total: 8, rewardRoll: 4 },
        bastion,
      ),
    ).toMatchObject({ goldGained: 200, defendersLost: 1 });
  });

  it('changes nothing for a quiet week', () => {
    expect(resolveEventOutcome('all-is-well', {}, bastion)).toEqual({
      goldGained: 0,
      goldPaid: 0,
      defendersGained: 0,
      defendersLost: 0,
      guestKind: null,
    });
  });
});

describe('armoryStockCost', () => {
  it('is 100 GP plus 100 GP per defender', () => {
    expect(armoryStockCost({ defenders: 4, hasSmithy: false })).toBe(500);
    expect(armoryStockCost({ defenders: 0, hasSmithy: false })).toBe(100);
  });

  it('is halved by a Smithy', () => {
    expect(armoryStockCost({ defenders: 4, hasSmithy: true })).toBe(250);
  });
});

describe('the Storehouse', () => {
  it.each([
    [5, 500],
    [9, 2000],
    [13, 5000],
    [20, 5000],
  ])('at level %i buys up to %i GP of goods', (level, limit) => {
    expect(storehouseBuyLimit(level)).toBe(limit);
  });

  it.each([
    [5, 330],
    [9, 360],
    [13, 450],
    [17, 600],
  ])('at level %i sells 300 GP of goods for %i GP', (level, price) => {
    expect(storehouseSalePrice(300, level)).toBe(price);
  });
});

describe('orderLimit', () => {
  it('is what the level allows', () => {
    expect(orderLimit({ allowance: 2, held: 1 })).toBe(2);
  });

  it('still covers everything someone was let hold beyond that', () => {
    expect(orderLimit({ allowance: 2, held: 3 })).toBe(3);
  });
});

describe('suggestedRecruits', () => {
  it('suggests the full four when there is room', () => {
    expect(suggestedRecruits({ capacity: 12, defenders: 4 })).toBe(4);
  });

  it('suggests only what the barracks still have bunks for', () => {
    expect(suggestedRecruits({ capacity: 12, defenders: 10 })).toBe(2);
  });

  it('leaves a full barrack to the DM', () => {
    expect(suggestedRecruits({ capacity: 12, defenders: 12 })).toBe(4);
  });
});
