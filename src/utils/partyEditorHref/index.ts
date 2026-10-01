/**
 * The Party page's character editor is driven by the URL, not by local
 * state: `/party?edit=<id>` opens that character, `/party?edit=new` opens a
 * blank form. That is what lets the tracker's Characters tab link straight
 * into the editor (DECISIONS #32), and what makes the open editor survive a
 * reload.
 */
export const PARTY_EDITOR_PARAM = 'edit';

/** The `?edit=` value that means "a new character" rather than an id. */
export const NEW_CHARACTER = 'new';

export const buildPartyEditorHref = (target: string) =>
  `/party?${PARTY_EDITOR_PARAM}=${encodeURIComponent(target)}` as const;

export type PartyEditorTarget<TCharacter> =
  | { kind: 'closed' }
  | { kind: 'new' }
  | { kind: 'edit'; character: TCharacter }
  /** The roster has not loaded, so an id cannot be resolved yet. */
  | { kind: 'pending' };

/**
 * What `?edit=` currently asks for. An id that matches nobody — removed in
 * another tab, or a stale bookmark — reads as closed rather than opening an
 * empty editor that would save over nothing.
 */
export const toPartyEditorTarget = <TCharacter extends { id: string }>(
  param: string | null,
  characters: readonly TCharacter[] | undefined,
): PartyEditorTarget<TCharacter> => {
  if (!param) return { kind: 'closed' };
  if (param === NEW_CHARACTER) return { kind: 'new' };
  if (!characters) return { kind: 'pending' };

  const character = characters.find(({ id }) => id === param);
  if (!character) return { kind: 'closed' };

  return { kind: 'edit', character };
};
