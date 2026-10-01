import type { APIRequestContext } from '@playwright/test';

/**
 * Empties the encounter completely — party included.
 *
 * `clearNonPlayerCombatants` deliberately keeps the party, which is right for
 * the app and wrong for a test that needs to assert on an empty board. Specs
 * share one database because the encounter is a singleton, so isolation has to
 * be done explicitly rather than assumed.
 */
export const clearEncounter = async (
  request: APIRequestContext,
  baseURL: string,
): Promise<void> => {
  await request.post(`${baseURL}/api/trpc/encounter.clearNonPlayerCombatants`, {
    data: {},
  });

  const response = await request.get(`${baseURL}/api/trpc/encounter.get`);
  const body = (await response.json()) as {
    result: { data: { json: { combatants: { id: string }[] } } };
  };

  for (const combatant of body.result.data.json.combatants) {
    await request.post(`${baseURL}/api/trpc/encounter.remove`, {
      data: { json: { id: combatant.id } },
    });
  }
};

/**
 * Deletes every saved encounter.
 *
 * Presets outlive an encounter by design, so clearing the board is not enough
 * to isolate a spec that asserts on the list of them.
 */
export const clearSavedEncounters = async (
  request: APIRequestContext,
  baseURL: string,
): Promise<void> => {
  const response = await request.get(`${baseURL}/api/trpc/presets.list`);
  const body = (await response.json()) as {
    result: { data: { json: { id: string }[] } };
  };

  for (const preset of body.result.data.json) {
    await request.post(`${baseURL}/api/trpc/presets.remove`, {
      data: { json: { id: preset.id } },
    });
  }
};

/**
 * Abandons every bastion and sets the campaign's bastion mode.
 *
 * The mode is campaign-wide and switching it merges or splits whatever
 * bastions exist, so a bastion spec cannot share the board with leftovers
 * from another run. Abandoning first means the switch has nothing to move.
 */
export const resetBastions = async (
  request: APIRequestContext,
  baseURL: string,
  mode: 'per-character' | 'party',
): Promise<void> => {
  const response = await request.get(`${baseURL}/api/trpc/bastions.list`);
  const body = (await response.json()) as {
    result: { data: { json: { id: string }[] } };
  };

  // A turn left half-finished by an earlier run would be resumed instead of
  // a fresh one started.
  const turn = await request.get(`${baseURL}/api/trpc/bastionTurns.current`);
  const turnBody = (await turn.json()) as {
    result: { data: { json: { turn: { id: string } | null } } };
  };
  const draft = turnBody.result.data.json.turn;
  if (draft) {
    await request.post(`${baseURL}/api/trpc/bastionTurns.discard`, {
      data: { json: { id: draft.id } },
    });
  }

  for (const bastion of body.result.data.json) {
    await request.post(`${baseURL}/api/trpc/bastions.abandon`, {
      data: { json: { id: bastion.id } },
    });
  }

  await request.post(`${baseURL}/api/trpc/bastions.setMode`, {
    data: {
      json:
        mode === 'party'
          ? { mode: 'party', name: 'Unused' }
          : { mode: 'per-character' },
    },
  });
};
