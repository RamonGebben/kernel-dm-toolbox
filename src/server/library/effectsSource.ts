/**
 * Where the animated spell-effect clips come from.
 *
 * Pinned to a commit, for the same reason `LIBRARY_GIT_REF` is (DECISIONS
 * #12): an import that silently produces different files on two machines is
 * exactly the failure `import_runs` exists to make visible.
 */
export const SPELL_EFFECTS_GIT_REF = '436fa96d7e9e97f8e6116c19c65f495d269f8093';

const SPELL_EFFECTS_BASE_URL =
  'https://raw.githubusercontent.com/jackkerouac/animated-spell-effects';

/**
 * GPL-3.0 — a stronger copyleft than the SRD library's CC-BY-4.0. Credited
 * for the same reason `LIBRARY_ATTRIBUTION` is: the licence requires it, and
 * it belongs in the README, not just here (DECISIONS #29).
 */
export const SPELL_EFFECTS_ATTRIBUTION = {
  title: 'Animated Spell Effects',
  author: 'Jack Kerouac',
  license: 'GPL-3.0',
  licenseUrl:
    'https://github.com/jackkerouac/animated-spell-effects/blob/master/LICENSE',
  sourceUrl: 'https://github.com/jackkerouac/animated-spell-effects',
} as const;

export const effectFileUrl = (
  sourcePath: string,
  gitRef: string = SPELL_EFFECTS_GIT_REF,
): string => `${SPELL_EFFECTS_BASE_URL}/${gitRef}/${sourcePath}`;

/** Injected so the import can be tested without touching the network — the
 * binary-fetching twin of `~/server/library/source`'s `FetchJson`. */
export type FetchBinary = (url: string) => Promise<ArrayBuffer>;

export const fetchBinary: FetchBinary = async url => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.arrayBuffer();
};
