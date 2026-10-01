'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import {
  turnSteps,
  type TurnDraft,
  type TurnEvent,
  type TurnStep,
} from '~/server/trpc/schemas/bastionTurns';
import {
  eventForRoll,
  isMaintaining,
  resolveEventOutcome,
} from '~/utils/bastionTurn';

export const stepAfter = (step: TurnStep): TurnStep =>
  turnSteps[Math.min(turnSteps.indexOf(step) + 1, turnSteps.length - 1)]!;

export const stepBefore = (step: TurnStep): TurnStep =>
  turnSteps[Math.max(turnSteps.indexOf(step) - 1, 0)]!;

/**
 * Keeps the events in step with who is maintaining: anyone who now gives
 * orders loses their rolls; anyone who now maintains gets an empty one to
 * fill in. Run whenever presence or Maintain changes.
 */
export const syncEventsWithActors = (draft: TurnDraft): TurnDraft => {
  const maintaining = draft.actors.filter(isMaintaining);
  const isFor = (event: TurnEvent, actor: TurnDraft['actors'][number]) =>
    event.bastionId === actor.bastionId &&
    event.characterId === actor.characterId;

  const kept = draft.events.filter(event =>
    maintaining.some(actor => isFor(event, actor)),
  );
  const missing = maintaining
    .filter(actor => !kept.some(event => isFor(event, actor)))
    .map(actor => blankEvent(actor.bastionId, actor.characterId));

  return { ...draft, events: [...kept, ...missing] };
};

/** An event still waiting for its d100 — roll 0 is "not rolled yet". */
export const blankEvent = (
  bastionId: string,
  characterId: string,
): TurnEvent => ({
  bastionId,
  characterId,
  roll: 0,
  key: 'all-is-well',
  goldGained: 0,
  goldPaid: 0,
  defendersGained: 0,
  defendersLost: 0,
  outOfActionFacilityId: null,
  storageItem: '',
  guestKind: null,
  note: '',
  inputs: {},
});

export const isRolled = (event: TurnEvent): boolean =>
  event.roll >= 1 && event.roll <= 100;

/**
 * An event after its d100 or its own dice changed: which event it is, and
 * what it comes to (`resolveEventOutcome`). Changing the d100 to a different
 * event clears that event's dice and choices.
 */
export const updateEvent = (
  event: TurnEvent,
  change: Partial<
    Pick<
      TurnEvent,
      'roll' | 'inputs' | 'outOfActionFacilityId' | 'storageItem' | 'note'
    >
  >,
  bastion: { defenderCount: number; hasGuestMonster: boolean },
): TurnEvent => {
  const roll = change.roll ?? event.roll;
  const key = roll >= 1 && roll <= 100 ? eventForRoll(roll).key : event.key;
  const isNewEvent = key !== event.key;
  const inputs = isNewEvent ? {} : (change.inputs ?? event.inputs);

  return {
    ...event,
    ...change,
    roll,
    key,
    inputs,
    outOfActionFacilityId: isNewEvent
      ? null
      : (change.outOfActionFacilityId ?? event.outOfActionFacilityId),
    storageItem: isNewEvent ? '' : (change.storageItem ?? event.storageItem),
    ...resolveEventOutcome(key, inputs, bastion),
  };
};

/**
 * Why the wizard cannot move past this step yet, or null when it can. The
 * server checks again on commit; this is so the DM is told at the step that
 * needs fixing, not at the end.
 */
export const stepBlocker = (draft: TurnDraft): string | null => {
  if (draft.step !== 'events') return null;

  const unrolled = draft.events.filter(event => !isRolled(event));
  return unrolled.length
    ? `${unrolled.length} Bastion Event${unrolled.length === 1 ? '' : 's'} still to roll.`
    : null;
};

export const useBastionTurn = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const current = useQuery(trpc.bastionTurns.current.queryOptions());
  const history = useQuery(trpc.bastionTurns.history.queryOptions());

  const invalidateTurn = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.bastionTurns.current.queryKey(),
    });

  const invalidateEverything = () =>
    Promise.all([
      invalidateTurn(),
      queryClient.invalidateQueries({
        queryKey: trpc.bastionTurns.history.queryKey(),
      }),
      queryClient.invalidateQueries({ queryKey: trpc.bastions.get.queryKey() }),
      queryClient.invalidateQueries({
        queryKey: trpc.bastions.list.queryKey(),
      }),
      queryClient.invalidateQueries({ queryKey: trpc.party.get.queryKey() }),
    ]);

  const start = useMutation(
    trpc.bastionTurns.start.mutationOptions({ onSuccess: invalidateTurn }),
  );
  const save = useMutation(
    trpc.bastionTurns.saveDraft.mutationOptions({ onSuccess: invalidateTurn }),
  );
  const preview = useMutation(trpc.bastionTurns.preview.mutationOptions());
  const discard = useMutation(
    trpc.bastionTurns.discard.mutationOptions({ onSuccess: invalidateTurn }),
  );
  const commit = useMutation(
    trpc.bastionTurns.commit.mutationOptions({
      onSuccess: invalidateEverything,
    }),
  );

  const turn = current.data?.turn ?? null;

  return {
    isPending: current.isPending,
    turn,
    context: (current.data?.context ?? null) as TurnContext | null,
    history: history.data ?? [],
    isSaving:
      start.isPending ||
      save.isPending ||
      discard.isPending ||
      commit.isPending,
    error:
      commit.error?.message ??
      save.error?.message ??
      start.error?.message ??
      null,
    preview: preview.data ?? null,
    isPreviewing: preview.isPending,
    start: () => start.mutateAsync(),
    save: (draft: TurnDraft) =>
      turn ? save.mutateAsync({ id: turn.id, draft }) : Promise.resolve(null),
    requestPreview: (draft: TurnDraft) =>
      turn ? preview.mutate({ id: turn.id, draft }) : undefined,
    discard: () => (turn ? discard.mutate({ id: turn.id }) : undefined),
    commit: () =>
      turn ? commit.mutateAsync({ id: turn.id }) : Promise.resolve(null),
  };
};
