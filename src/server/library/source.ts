import { z } from 'zod';
import { fixtureFiles, type FixtureFileName } from '~/server/library/fixtures';

/**
 * Where the library comes from.
 *
 * Pinned to a commit rather than a branch: `staging` moves, and an import that
 * silently produces different data on two machines is exactly the failure the
 * `import_runs` table exists to make visible (DECISIONS #12).
 */
export const LIBRARY_GIT_REF = 'staging';

const FIXTURE_BASE_URL = 'https://raw.githubusercontent.com/open5e/open5e-api';

export type LibraryLicense = 'cc-by-40' | 'ogl-10a';

export type LibraryAttribution = {
  title: string;
  publisher: string;
  license: LibraryLicense;
  licenseUrl: string;
  sourceUrl: string;
};

export type CreatureLibrarySource = LibraryAttribution & {
  /** The `data/v2/<publisher>/<document>` path segment on open5e-api. */
  path: string;
};

const CC_BY_40_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';

/** OGL 1.0a has no single canonical hosting URL worth pinning to — the
 * required piece is the Section 15 copyright chain below, not a link. */
const OGL_1_0A_LICENSE_URL = 'https://en.wikipedia.org/wiki/Open_Game_License';

/**
 * SRD 5.2 is the primary source: creatures, conditions, and spells all come
 * from here (DECISIONS #24). Every other source below is creature-only.
 */
export const SRD_SOURCE: CreatureLibrarySource = {
  path: 'wizards-of-the-coast/srd-2024',
  title: 'System Reference Document 5.2',
  publisher: 'Wizards of the Coast',
  license: 'cc-by-40',
  licenseUrl: CC_BY_40_LICENSE_URL,
  sourceUrl: 'https://dnd.wizards.com/resources/systems-reference-document',
};

/**
 * Supplementary bestiaries: creatures, actions, attacks and traits only — no
 * conditions or spells. This is a combat toolbox, not a character builder
 * (DECISIONS #24's own reasoning), and every condition a monster can inflict
 * is already covered by the SRD's own glossary; there is nothing
 * publisher-specific to add there.
 *
 * Each of these is OGL 1.0a, not the SRD's CC-BY-4.0 — see the README's
 * "Open Game License content" section for the Section 15 copyright notice
 * this requires, built from these entries plus each document's own `author`
 * field at import time.
 */
export const SUPPLEMENTARY_CREATURE_SOURCES: readonly CreatureLibrarySource[] =
  [
    {
      path: 'en-publishing/a5e-mm',
      title: 'Monstrous Menagerie',
      publisher: 'EN Publishing',
      license: 'ogl-10a',
      licenseUrl: OGL_1_0A_LICENSE_URL,
      sourceUrl:
        'https://enpublishingrpg.com/collections/level-up-advanced-5th-edition-a5e/products/level-up-monstrous-menagerie-a5e',
    },
    {
      path: 'kobold-press/tob',
      title: 'Tome of Beasts',
      publisher: 'Kobold Press',
      license: 'ogl-10a',
      licenseUrl: OGL_1_0A_LICENSE_URL,
      sourceUrl: 'https://koboldpress.com/tome-of-beasts/',
    },
    {
      path: 'kobold-press/tob-2023',
      title: 'Tome of Beasts 1 (2023 Edition)',
      publisher: 'Kobold Press',
      license: 'ogl-10a',
      licenseUrl: OGL_1_0A_LICENSE_URL,
      sourceUrl:
        'https://koboldpress.com/kpstore/product/tome-of-beasts-1-2023-edition-hardcover/',
    },
    {
      path: 'kobold-press/tob2',
      title: 'Tome of Beasts 2',
      publisher: 'Kobold Press',
      license: 'ogl-10a',
      licenseUrl: OGL_1_0A_LICENSE_URL,
      sourceUrl: 'https://koboldpress.com/tome-of-beasts-2/',
    },
    {
      path: 'kobold-press/tob3',
      title: 'Tome of Beasts 3',
      publisher: 'Kobold Press',
      license: 'ogl-10a',
      licenseUrl: OGL_1_0A_LICENSE_URL,
      sourceUrl: 'https://koboldpress.com/tome-of-beasts-3/',
    },
    {
      path: 'kobold-press/ccdx',
      title: 'Creature Codex',
      publisher: 'Kobold Press',
      license: 'ogl-10a',
      licenseUrl: OGL_1_0A_LICENSE_URL,
      sourceUrl:
        'https://koboldpress.com/kpstore/product/creature-codex-for-5th-edition-dnd/',
    },
    {
      path: 'green-ronin/tdcs',
      title: "Tal'Dorei Campaign Setting",
      publisher: 'Green Ronin',
      license: 'ogl-10a',
      licenseUrl: OGL_1_0A_LICENSE_URL,
      sourceUrl:
        "https://en.wikipedia.org/wiki/Critical_Role:_Tal'Dorei_Campaign_Setting",
    },
  ];

/** Every document the creature import pulls from, SRD first. */
export const CREATURE_LIBRARY_SOURCES: readonly CreatureLibrarySource[] = [
  SRD_SOURCE,
  ...SUPPLEMENTARY_CREATURE_SOURCES,
];

/** What `library.status` reports — every license this install's data is
 * actually under, not just the SRD's. */
export const LIBRARY_ATTRIBUTIONS: readonly LibraryAttribution[] =
  CREATURE_LIBRARY_SOURCES.map(
    ({ path: _path, ...attribution }) => attribution,
  );

export const fixtureUrl = (
  fileName: FixtureFileName,
  gitRef: string,
  sourcePath: string,
): string =>
  `${FIXTURE_BASE_URL}/${gitRef}/data/v2/${sourcePath}/${fileName}.json`;

/** Injected so the import can be tested without touching the network. */
export type FetchJson = (url: string) => Promise<unknown>;

export const fetchJson: FetchJson = async url => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};

/**
 * Fetches one fixture file and parses every record.
 *
 * Validation failures name the file and the offending record, because "the
 * import failed" is useless when the cause is one changed field upstream.
 *
 * `optional` tolerates a 404 by returning an empty list instead of throwing —
 * not every source publishes every file (Tome of Beasts 3 has no
 * `CreatureActionAttack.json` at all), and a source is otherwise perfectly
 * importable without it. A non-404 failure (network error, bad JSON, a schema
 * mismatch) still throws either way; only "this file doesn't exist here" is
 * swallowed.
 */
export const loadFixture = async <TName extends FixtureFileName>(
  fileName: TName,
  {
    gitRef,
    sourcePath,
    fetchJson: fetchImpl,
    optional = false,
  }: {
    gitRef: string;
    sourcePath: string;
    fetchJson: FetchJson;
    optional?: boolean;
  },
): Promise<z.infer<(typeof fixtureFiles)[TName]>[]> => {
  const url = fixtureUrl(fileName, gitRef, sourcePath);

  let payload: unknown;
  try {
    payload = await fetchImpl(url);
  } catch (error) {
    if (optional && error instanceof Error && /\b404\b/.test(error.message)) {
      return [];
    }
    throw error;
  }

  const records = z.array(z.unknown()).parse(payload);
  const schema = fixtureFiles[fileName];

  return records.map((record, index) => {
    const parsed = schema.safeParse(record);

    if (!parsed.success) {
      throw new Error(
        `${sourcePath}/${fileName}.json record ${index} did not match the expected shape: ${parsed.error.message}`,
      );
    }

    return parsed.data as z.infer<(typeof fixtureFiles)[TName]>;
  });
};
