import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '~/server/db/schema';
import {
  characterClasses,
  creatureActions,
  creatureActionAttacks,
  creatureTraits,
  creatures,
  playerCharacters,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import { appRouter } from '~/server/trpc/routers/_app';
import { createCallerFactory } from '~/server/trpc/init';
import { loadScenarioCombatants } from '~/server/simulator/loadScenarioCombatants';

const createCaller = createCallerFactory(appRouter);

let db: Database;
let caller: ReturnType<typeof createCaller>;

const seedGoblin = async () => {
  await db.insert(creatures).values({
    slug: 'srd-2024_goblin',
    document: 'srd-2024',
    name: 'Goblin',
    size: 'small',
    type: 'humanoid',
    category: 'Monsters',
    alignment: 'chaotic neutral',
    challengeRating: 0.125,
    armorClass: 15,
    hitPoints: 7,
    hitDice: '2d6',
    initiativeBonus: 2,
    walk: 30,
    abilityScoreStrength: 8,
    abilityScoreDexterity: 15,
    abilityScoreConstitution: 10,
    abilityScoreIntelligence: 10,
    abilityScoreWisdom: 8,
    abilityScoreCharisma: 8,
    passivePerception: 9,
  });

  await db.insert(creatureActions).values({
    slug: 'srd-2024_goblin-scimitar',
    creatureSlug: 'srd-2024_goblin',
    name: 'Scimitar',
    desc: 'Melee Attack Roll: +4',
    actionType: 'ACTION',
    sortOrder: 0,
  });

  await db.insert(creatureActionAttacks).values({
    slug: 'srd-2024_goblin-scimitar-attack',
    actionSlug: 'srd-2024_goblin-scimitar',
    name: 'Scimitar',
    toHitMod: 4,
    reach: 5,
    damageDieCount: 1,
    damageDieType: 'D6',
    damageBonus: 2,
    damageType: 'slashing',
  });
};

const seedDragonWithLegendaryResistance = async () => {
  await db.insert(creatures).values({
    slug: 'srd-2024_dragon',
    document: 'srd-2024',
    name: 'Adult Black Dragon',
    size: 'huge',
    type: 'dragon',
    category: 'Monsters',
    alignment: 'chaotic evil',
    challengeRating: 17,
    armorClass: 19,
    hitPoints: 195,
    hitDice: '17d12+85',
    initiativeBonus: 8,
    walk: 40,
    abilityScoreStrength: 23,
    abilityScoreDexterity: 14,
    abilityScoreConstitution: 21,
    abilityScoreIntelligence: 14,
    abilityScoreWisdom: 13,
    abilityScoreCharisma: 19,
    passivePerception: 21,
  });

  await db.insert(creatureTraits).values({
    slug: 'srd-2024_dragon-legendary-resistance',
    creatureSlug: 'srd-2024_dragon',
    name: 'Legendary Resistance (4/Day)',
    desc: 'If the dragon fails a saving throw, it can choose to succeed instead.',
  });
};

beforeEach(async () => {
  const client = createClient({ url: ':memory:' });
  db = drizzle(client, { schema }) as Database;
  await migrate(db, { migrationsFolder: 'src/server/db/migrations' });

  caller = createCaller({
    db,
    headers: new Headers(),
    campaignName: 'Test Campaign',
  });

  await seedGoblin();
  await seedDragonWithLegendaryResistance();
});

describe('loadScenarioCombatants', () => {
  it('resolves a scenario into party and monster combatants', async () => {
    const pc = await caller.characters.create({
      name: 'Ari',
      armorClass: 16,
      maxHitPoints: 30,
      initiativeModifier: 3,
      level: 4,
    });

    await caller.characters.updateCombatData({
      id: pc.id,
      actions: [
        {
          name: 'Shortsword',
          desc: 'A quick slash.',
          actionType: 'ACTION',
          attack: {
            name: 'Shortsword',
            toHitMod: 6,
            reach: 5,
            damageDieCount: 1,
            damageDieType: 'd6',
            damageBonus: 4,
            damageType: 'piercing',
          },
        },
      ],
    });

    const customCreature = await caller.customCreatures.create({
      name: 'Swamp Lurker',
      size: 'Large',
      type: 'monstrosity',
      alignment: 'unaligned',
      challengeRating: 3,
      armorClass: 13,
      hitPoints: 45,
      hitDice: '6d10 + 12',
      abilityScoreStrength: 16,
      abilityScoreDexterity: 12,
      abilityScoreConstitution: 15,
      abilityScoreIntelligence: 4,
      abilityScoreWisdom: 10,
      abilityScoreCharisma: 5,
      passivePerception: 10,
      actions: [
        {
          name: 'Claw',
          desc: 'A raking claw.',
          actionType: 'ACTION',
          attack: {
            name: 'Claw',
            toHitMod: 5,
            reach: 10,
            damageDieCount: 2,
            damageDieType: 'd6',
            damageBonus: 3,
            damageType: 'slashing',
          },
        },
      ],
    });

    const scenario = await caller.simulator.create({ name: 'Bridge ambush' });
    await caller.simulator.addPartyMember({
      scenarioId: scenario.id,
      playerCharacterId: pc.id,
    });
    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      creatureSlug: 'srd-2024_goblin',
      count: 2,
    });
    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      creatureSlug: 'srd-2024_dragon',
      count: 1,
    });
    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      customCreatureId: customCreature.id,
      count: 1,
    });

    const combatants = await loadScenarioCombatants(db, scenario.id);

    expect(combatants).toHaveLength(5);

    const party = combatants.filter(c => c.side === 'party');
    expect(party).toHaveLength(1);
    expect(party[0]).toMatchObject({
      name: 'Ari',
      armorClass: 16,
      maxHitPoints: 30,
      currentHitPoints: 30,
      initiativeBonus: 3,
    });
    expect(party[0]?.saveModifiers).toEqual({
      strength: 3,
      dexterity: 3,
      constitution: 3,
      intelligence: 3,
      wisdom: 3,
      charisma: 3,
    });
    expect(party[0]?.actions).toHaveLength(1);
    expect(party[0]?.actions[0]?.attack).toMatchObject({
      toHitMod: 6,
      damageDieCount: 1,
      damageDieType: 6,
      damageBonus: 4,
    });

    const goblins = combatants.filter(
      c => c.templateKey && c.name.startsWith('Goblin'),
    );
    expect(goblins.map(g => g.name).sort()).toEqual(['Goblin 1', 'Goblin 2']);
    for (const goblin of goblins) {
      expect(goblin.side).toBe('monsters');
      expect(goblin.maxHitPoints).toBe(7);
      expect(goblin.actions[0]?.attack).toMatchObject({
        toHitMod: 4,
        damageDieType: 6,
      });
    }

    const dragon = combatants.find(c => c.name === 'Adult Black Dragon');
    expect(dragon?.legendaryResistancesRemaining).toBe(3);

    const lurker = combatants.find(c => c.name === 'Swamp Lurker');
    expect(lurker?.side).toBe('monsters');
    expect(lurker?.actions[0]?.attack).toMatchObject({
      toHitMod: 5,
      damageDieCount: 2,
    });

    // Every combatant lands somewhere on the default grid.
    for (const combatant of combatants) {
      expect(combatant.position.x).toBeGreaterThanOrEqual(0);
      expect(combatant.position.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('derives attacksPerTurn for a PC from classProgression, and defaults monsters to 1', async () => {
    await db.insert(characterClasses).values({
      slug: 'srd-2024_fighter',
      document: 'srd-2024',
      name: 'Fighter',
      casterType: 'NONE',
    });

    const noClassPc = await caller.characters.create({
      name: 'Ari',
      armorClass: 16,
      maxHitPoints: 30,
      initiativeModifier: 3,
      level: 4,
    });

    const fighter = await caller.characters.create({
      name: 'Borin',
      armorClass: 18,
      maxHitPoints: 44,
      initiativeModifier: 1,
      level: 5,
    });
    await db
      .update(playerCharacters)
      .set({ characterClassSlug: 'srd-2024_fighter' })
      .where(eq(playerCharacters.id, fighter.id));

    const scenario = await caller.simulator.create({ name: 'Extra Attack' });
    await caller.simulator.addPartyMember({
      scenarioId: scenario.id,
      playerCharacterId: noClassPc.id,
    });
    await caller.simulator.addPartyMember({
      scenarioId: scenario.id,
      playerCharacterId: fighter.id,
    });
    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      creatureSlug: 'srd-2024_goblin',
      count: 1,
    });

    const combatants = await loadScenarioCombatants(db, scenario.id);

    expect(combatants.find(c => c.name === 'Ari')?.attacksPerTurn).toBe(1);
    // Fighter level 5: Extra Attack grants a second attack.
    expect(combatants.find(c => c.name === 'Borin')?.attacksPerTurn).toBe(2);
    expect(combatants.find(c => c.name === 'Goblin')?.attacksPerTurn).toBe(1);
  });

  it("materializes a PC's prepared spell into an EngineAction with a real spell slot", async () => {
    await db.insert(schema.conditions).values({
      slug: 'srd-2024_paralyzed',
      key: 'paralyzed',
      name: 'Paralyzed',
      desc: 'A paralyzed creature is incapacitated and cannot move or speak.',
    });
    await db.insert(schema.spells).values({
      slug: 'srd-2024_hold-person',
      document: 'srd-2024',
      name: 'Hold Person',
      desc: 'Choose a humanoid you can see within range.',
      level: 2,
      school: 'enchantment',
      castingTime: '1 action',
      duration: 'Concentration, up to 1 minute',
      savingThrowAbility: 'wisdom',
      attackRoll: false,
      concentration: true,
      appliesConditionSlug: 'srd-2024_paralyzed',
      conditionSaveEndsEachTurn: true,
    });

    const caster = await caller.characters.create({
      name: 'Elowen',
      armorClass: 12,
      maxHitPoints: 20,
      initiativeModifier: 2,
      level: 5,
    });
    await db.insert(schema.playerCharacterSpells).values({
      playerCharacterId: caster.id,
      spellSlug: 'srd-2024_hold-person',
      isPrepared: true,
      isAlwaysAvailable: false,
    });
    await db.insert(schema.playerCharacterSpellSlots).values({
      playerCharacterId: caster.id,
      spellLevel: 2,
      maxSlots: 3,
    });

    const scenario = await caller.simulator.create({ name: 'Caster test' });
    await caller.simulator.addPartyMember({
      scenarioId: scenario.id,
      playerCharacterId: caster.id,
    });
    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      creatureSlug: 'srd-2024_goblin',
      count: 1,
    });

    const combatants = await loadScenarioCombatants(db, scenario.id);
    const elowen = combatants.find(c => c.name === 'Elowen');

    expect(elowen?.spellSlotsRemaining).toEqual({ 2: 3 });
    const spellAction = elowen?.actions.find(a => a.name === 'Hold Person');
    expect(spellAction).toMatchObject({
      isSpell: true,
      requiresSpellSlotLevel: 2,
      requiresConcentration: true,
      save: expect.objectContaining({
        saveAbility: 'wisdom',
        appliesConditionKey: 'paralyzed',
      }),
    });
  });

  it('resolves a real Multiattack action into an ordered attack sequence', async () => {
    await db.insert(creatures).values({
      slug: 'srd-2024_ogre',
      document: 'srd-2024',
      name: 'Ogre',
      size: 'large',
      type: 'giant',
      category: 'Monsters',
      alignment: 'chaotic evil',
      challengeRating: 2,
      armorClass: 11,
      hitPoints: 59,
      hitDice: '7d10+21',
      initiativeBonus: -1,
      walk: 40,
      abilityScoreStrength: 19,
      abilityScoreDexterity: 8,
      abilityScoreConstitution: 16,
      abilityScoreIntelligence: 5,
      abilityScoreWisdom: 7,
      abilityScoreCharisma: 7,
      passivePerception: 8,
    });
    await db.insert(creatureActions).values([
      {
        slug: 'srd-2024_ogre-multiattack',
        creatureSlug: 'srd-2024_ogre',
        name: 'Multiattack',
        desc: 'The ogre makes two Greatclub attacks.',
        actionType: 'ACTION',
        sortOrder: 0,
        multiattackSequence: [{ actionName: 'Greatclub', count: 2 }],
      },
      {
        slug: 'srd-2024_ogre-greatclub',
        creatureSlug: 'srd-2024_ogre',
        name: 'Greatclub',
        desc: 'Melee Attack Roll: +6',
        actionType: 'ACTION',
        sortOrder: 1,
      },
    ]);
    await db.insert(creatureActionAttacks).values({
      slug: 'srd-2024_ogre-greatclub-attack',
      actionSlug: 'srd-2024_ogre-greatclub',
      name: 'Greatclub',
      toHitMod: 6,
      reach: 10,
      damageDieCount: 2,
      damageDieType: 'D8',
      damageBonus: 4,
      damageType: 'bludgeoning',
    });

    const scenario = await caller.simulator.create({ name: 'Ogre test' });
    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      creatureSlug: 'srd-2024_ogre',
      count: 1,
    });

    const combatants = await loadScenarioCombatants(db, scenario.id);
    const ogre = combatants.find(c => c.name === 'Ogre');

    expect(ogre?.multiattackSequence).toHaveLength(1);
    const greatclubAction = ogre?.actions.find(a => a.name === 'Greatclub');
    expect(ogre?.multiattackSequence).toEqual([
      { actionId: greatclubAction?.id, count: 2 },
    ]);
  });

  it('drops a monster entry once its custom creature is removed', async () => {
    const customCreature = await caller.customCreatures.create({
      name: 'Swamp Lurker',
      size: 'Large',
      type: 'monstrosity',
      alignment: 'unaligned',
      challengeRating: 3,
      armorClass: 13,
      hitPoints: 45,
      hitDice: '6d10 + 12',
      abilityScoreStrength: 16,
      abilityScoreDexterity: 12,
      abilityScoreConstitution: 15,
      abilityScoreIntelligence: 4,
      abilityScoreWisdom: 10,
      abilityScoreCharisma: 5,
      passivePerception: 10,
    });

    const scenario = await caller.simulator.create({ name: 'Stale entry' });
    await caller.simulator.addMonsterEntry({
      scenarioId: scenario.id,
      customCreatureId: customCreature.id,
      count: 1,
    });

    await caller.customCreatures.remove({ id: customCreature.id });

    const combatants = await loadScenarioCombatants(db, scenario.id);
    expect(combatants).toHaveLength(0);
  });

  it('throws for a scenario that does not exist', async () => {
    await expect(
      loadScenarioCombatants(db, crypto.randomUUID()),
    ).rejects.toThrow();
  });
});
