import type {
  EngineResult,
  EngineSide,
  TurnLogEntry,
} from '~/server/simulator/engine/types';

export type RoundDistributionBucket = { rounds: number; trials: number };

export type CombatantBatchStats = {
  templateKey: string;
  /** `buildCombatantNames`' base label with any trailing " 2"/" 3"… instance
   * number stripped — a 4-goblin monster entry reports as one "Goblin" row,
   * not four. */
  name: string;
  side: EngineSide;
  /** Fraction of individual instances (a 4-goblin entry contributes 4 per
   * trial) that survived to the end of their trial. For a death-save-eligible
   * combatant (a PC), "survived" means "didn't die" — a stabilized or still-
   * `dying` PC at 0 HP still counts, matching `EngineFinalCombatantState.
   * survived`'s own definition (issue #5, milestone 12). */
  survivalRate: number;
  /**
   * Fraction of individual instances that were knocked to 0 HP at least once
   * during their trial (a `down` log entry), regardless of whether they went
   * on to stabilize, get revived, or die — always 0 for a combatant that
   * never tracks death saves (every monster; see `EngineCombatant.
   * tracksDeathSaves`), since those are removed outright at 0 HP instead.
   * This is the signal `survivalRate` alone can't give a DM balancing a
   * fight: "the party won" and "the party won without anyone dropping" are
   * different outcomes worth seeing separately (issue #5, milestone 13).
   */
  wentDownRate: number;
  /** Per-instance average across every trial — see the doc comment on
   * `aggregateBatchResults` for why this is per-instance, not per-trial. */
  averageDamageDealt: number;
  averageDamageTaken: number;
  /** Average kills credited per instance per trial. */
  killRate: number;
};

export type BatchSummary = {
  trialCount: number;
  baseSeed: number;
  partyWinRate: number;
  monsterWinRate: number;
  drawRate: number;
  roundsMin: number;
  roundsMax: number;
  roundsMean: number;
  roundsMedian: number;
  roundDistribution: RoundDistributionBucket[];
  combatants: CombatantBatchStats[];
};

/** Strips `buildCombatantNames`' own " 2"/" 3"… instance-numbering suffix
 * so every individual in a stack reports under one shared label. */
const baseInstanceName = (name: string): string => name.replace(/ \d+$/, '');

type Tally = {
  damageDealt: Map<string, number>;
  damageTaken: Map<string, number>;
  kills: Map<string, number>;
  /** `templateKey`s that had at least one `down` entry this trial. */
  wentDown: Set<string>;
};

const addTo = (map: Map<string, number>, key: string, amount: number) => {
  map.set(key, (map.get(key) ?? 0) + amount);
};

/**
 * Attributes damage and kills from one trial's log to the `templateKey` of
 * the combatant instance responsible — not to `combatantId`, since a
 * multi-monster entry's individual instances each get a fresh id per trial
 * but share one `templateKey` (see `EngineCombatant.templateKey`'s own doc
 * comment). `id -> templateKey` is rebuilt per result from
 * `result.combatants` rather than assumed stable across trials, so this
 * works whether or not the caller reuses combatant ids between runs.
 *
 * A `defeated` entry is attributed to whichever `attack`/`save-effect` entry
 * most recently logged before it — always the entry that caused it, since
 * `runEncounter` never pushes another log entry in between (see its own
 * `applyUpdate`/`resolveChoice`/`checkOpportunityAttacks`: the defeat check
 * runs immediately after applying the very update that dealt the damage).
 */
const tallyResult = (result: EngineResult): Tally => {
  const templateKeyById = new Map(
    result.combatants.map(c => [c.id, c.templateKey]),
  );
  const damageDealt = new Map<string, number>();
  const damageTaken = new Map<string, number>();
  const kills = new Map<string, number>();
  const wentDown = new Set<string>();
  let lastAttackerTemplateKey: string | null = null;

  const recordDamage = (
    attackerId: string,
    targetId: string,
    damage: number,
  ) => {
    const attackerKey = templateKeyById.get(attackerId) ?? null;
    const targetKey = templateKeyById.get(targetId) ?? null;
    lastAttackerTemplateKey = attackerKey;
    if (!attackerKey || !targetKey || damage <= 0) return;
    addTo(damageDealt, attackerKey, damage);
    addTo(damageTaken, targetKey, damage);
  };

  const handle = (entry: TurnLogEntry) => {
    if (entry.kind === 'attack') {
      recordDamage(
        entry.combatantId,
        entry.targetId,
        entry.hit ? entry.damage : 0,
      );
      return;
    }

    if (entry.kind === 'save-effect') {
      const attackerKey = templateKeyById.get(entry.combatantId) ?? null;
      lastAttackerTemplateKey = attackerKey;
      for (const target of entry.targets) {
        const targetKey = templateKeyById.get(target.targetId) ?? null;
        if (!attackerKey || !targetKey || target.damage <= 0) continue;
        addTo(damageDealt, attackerKey, target.damage);
        addTo(damageTaken, targetKey, target.damage);
      }
      return;
    }

    if (entry.kind === 'defeated' && lastAttackerTemplateKey) {
      addTo(kills, lastAttackerTemplateKey, 1);
      return;
    }

    if (entry.kind === 'down') {
      const key = templateKeyById.get(entry.combatantId);
      if (key) wentDown.add(key);
    }
  };

  result.log.forEach(handle);

  return { damageDealt, damageTaken, kills, wentDown };
};

const median = (sorted: readonly number[]): number => {
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
};

/**
 * Reduces N seeded `runEncounter` results into balance-check stats: win
 * rate, round-length distribution, and per-combatant survival/damage/kill
 * rates — the exact shape persisted to `simulator_scenarios.lastRunSummary`
 * and rendered by the Monte Carlo results panel (issue #5, milestone 6).
 *
 * Damage/kill stats are **per instance**, not per trial: a 4-goblin monster
 * entry's `averageDamageDealt` is "what one goblin in this stack deals on
 * average," matching `survivalRate`'s own per-instance granularity — the
 * two numbers are meant to be read side by side, so they use the same unit.
 */
export const aggregateBatchResults = (
  baseSeed: number,
  results: readonly EngineResult[],
): BatchSummary => {
  const trialCount = results.length;

  const winCounts = results.reduce(
    (acc, result) => {
      acc[result.winner] += 1;
      return acc;
    },
    { party: 0, monsters: 0, draw: 0 } as Record<EngineSide | 'draw', number>,
  );

  const rounds = results.map(result => result.rounds);
  const sortedRounds = [...rounds].sort((a, b) => a - b);
  const roundCounts = new Map<number, number>();
  for (const value of rounds) {
    roundCounts.set(value, (roundCounts.get(value) ?? 0) + 1);
  }

  const roundDistribution: RoundDistributionBucket[] = [
    ...roundCounts.entries(),
  ]
    .map(([roundsValue, trials]) => ({ rounds: roundsValue, trials }))
    .sort((a, b) => a.rounds - b.rounds);

  type CombatantAccumulator = {
    templateKey: string;
    name: string;
    side: EngineSide;
    totalInstances: number;
    survivedInstances: number;
    wentDownInstances: number;
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalKills: number;
  };

  const combatantAcc = new Map<string, CombatantAccumulator>();

  for (const result of results) {
    const { damageDealt, damageTaken, kills, wentDown } = tallyResult(result);

    for (const finalState of result.combatants) {
      const existing = combatantAcc.get(finalState.templateKey) ?? {
        templateKey: finalState.templateKey,
        name: baseInstanceName(finalState.name),
        side: finalState.side,
        totalInstances: 0,
        survivedInstances: 0,
        wentDownInstances: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        totalKills: 0,
      };

      existing.totalInstances += 1;
      if (finalState.survived) existing.survivedInstances += 1;
      if (wentDown.has(finalState.templateKey)) existing.wentDownInstances += 1;
      combatantAcc.set(finalState.templateKey, existing);
    }

    for (const [templateKey, amount] of damageDealt) {
      const existing = combatantAcc.get(templateKey);
      if (existing) existing.totalDamageDealt += amount;
    }
    for (const [templateKey, amount] of damageTaken) {
      const existing = combatantAcc.get(templateKey);
      if (existing) existing.totalDamageTaken += amount;
    }
    for (const [templateKey, amount] of kills) {
      const existing = combatantAcc.get(templateKey);
      if (existing) existing.totalKills += amount;
    }
  }

  const combatants: CombatantBatchStats[] = [...combatantAcc.values()]
    .map(acc => ({
      templateKey: acc.templateKey,
      name: acc.name,
      side: acc.side,
      survivalRate: acc.survivedInstances / acc.totalInstances,
      wentDownRate: acc.wentDownInstances / acc.totalInstances,
      averageDamageDealt: acc.totalDamageDealt / acc.totalInstances,
      averageDamageTaken: acc.totalDamageTaken / acc.totalInstances,
      killRate: acc.totalKills / acc.totalInstances,
    }))
    .sort((a, b) => (a.side === b.side ? 0 : a.side === 'party' ? -1 : 1));

  return {
    trialCount,
    baseSeed,
    partyWinRate: trialCount ? winCounts.party / trialCount : 0,
    monsterWinRate: trialCount ? winCounts.monsters / trialCount : 0,
    drawRate: trialCount ? winCounts.draw / trialCount : 0,
    roundsMin: sortedRounds[0] ?? 0,
    roundsMax: sortedRounds.at(-1) ?? 0,
    roundsMean: trialCount ? rounds.reduce((a, b) => a + b, 0) / trialCount : 0,
    roundsMedian: median(sortedRounds),
    roundDistribution,
    combatants,
  };
};
