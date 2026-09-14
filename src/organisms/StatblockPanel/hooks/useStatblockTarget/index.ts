'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useSelectionStore } from '~/stores/selection';

type CombatantLike = {
  id: string;
  displayName: string;
  creatureSlug: string | null;
  customCreatureId: string | null;
  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  armorClass: number;
  isHidden: boolean;
  conditions: {
    id: string;
    name: string;
    roundsRemaining: number | null;
    note: string | null;
  }[];
};

export type StatblockTarget =
  | { kind: 'none' }
  /** A library creature, browsed or selected in the order. */
  | { kind: 'creature'; slug: string; combatant: CombatantLike | null }
  /** A DM-authored creature, browsed or selected in the order. */
  | { kind: 'customCreature'; id: string; combatant: CombatantLike | null }
  /** A party member: there is no statblock to show, only their own numbers. */
  | { kind: 'character'; combatant: CombatantLike };

/**
 * Works out what the right-hand panel should show.
 *
 * Pure, and worth its own tests: the panel is driven by three mutually
 * exclusive selections plus a list that may not have loaded yet, and getting
 * the precedence wrong shows the previous creature's statblock next to the
 * newly selected combatant's name.
 */
export const toStatblockTarget = ({
  selectedCreatureSlug,
  selectedCustomCreatureId,
  selectedCombatantId,
  combatants,
}: {
  selectedCreatureSlug: string | null;
  selectedCustomCreatureId: string | null;
  selectedCombatantId: string | null;
  combatants: readonly CombatantLike[];
}): StatblockTarget => {
  if (selectedCombatantId) {
    const combatant = combatants.find(
      candidate => candidate.id === selectedCombatantId,
    );

    // The combatant was removed, or the encounter has not loaded yet. Showing
    // nothing is correct; showing a stale statblock is not.
    if (!combatant) return { kind: 'none' };

    if (combatant.creatureSlug) {
      return { kind: 'creature', slug: combatant.creatureSlug, combatant };
    }

    if (combatant.customCreatureId) {
      return {
        kind: 'customCreature',
        id: combatant.customCreatureId,
        combatant,
      };
    }

    return { kind: 'character', combatant };
  }

  if (selectedCreatureSlug) {
    return { kind: 'creature', slug: selectedCreatureSlug, combatant: null };
  }

  if (selectedCustomCreatureId) {
    return {
      kind: 'customCreature',
      id: selectedCustomCreatureId,
      combatant: null,
    };
  }

  return { kind: 'none' };
};

export const useStatblockTarget = () => {
  const trpc = useTRPC();
  const selectedCreatureSlug = useSelectionStore(
    state => state.selectedCreatureSlug,
  );
  const selectedCustomCreatureId = useSelectionStore(
    state => state.selectedCustomCreatureId,
  );
  const selectedCombatantId = useSelectionStore(
    state => state.selectedCombatantId,
  );

  const encounter = useQuery(trpc.encounter.get.queryOptions());

  const target = toStatblockTarget({
    selectedCreatureSlug,
    selectedCustomCreatureId,
    selectedCombatantId,
    combatants: encounter.data?.combatants ?? [],
  });

  const slug = target.kind === 'creature' ? target.slug : '';
  const customId = target.kind === 'customCreature' ? target.id : '';

  const libraryStatblock = useQuery({
    ...trpc.library.getCreature.queryOptions({ slug }),
    enabled: slug !== '',
  });

  const customStatblock = useQuery({
    ...trpc.customCreatures.get.queryOptions({ id: customId }),
    enabled: customId !== '',
  });

  return {
    target,
    // A disabled query reports `isPending` forever, which would leave a
    // skeleton on screen with nothing selected. Nothing selected is not
    // loading.
    isPending:
      (slug !== '' && libraryStatblock.isPending) ||
      (customId !== '' && customStatblock.isPending),
    statblock: libraryStatblock.data ?? customStatblock.data ?? null,
  };
};
