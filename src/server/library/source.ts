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
const FIXTURE_PATH = 'data/v2/wizards-of-the-coast/srd-2024';

/** SRD 5.2 is CC-BY-4.0; the credit is a product requirement, not a comment. */
export const LIBRARY_ATTRIBUTION = {
  title: 'System Reference Document 5.2',
  publisher: 'Wizards of the Coast',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  sourceUrl: 'https://github.com/open5e/open5e-api',
} as const;

export const fixtureUrl = (
  fileName: FixtureFileName,
  gitRef: string = LIBRARY_GIT_REF,
): string => `${FIXTURE_BASE_URL}/${gitRef}/${FIXTURE_PATH}/${fileName}.json`;

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
 */
export const loadFixture = async <TName extends FixtureFileName>(
  fileName: TName,
  { gitRef, fetchJson: fetchImpl }: { gitRef: string; fetchJson: FetchJson },
): Promise<z.infer<(typeof fixtureFiles)[TName]>[]> => {
  const payload = await fetchImpl(fixtureUrl(fileName, gitRef));
  const records = z.array(z.unknown()).parse(payload);
  const schema = fixtureFiles[fileName];

  return records.map((record, index) => {
    const parsed = schema.safeParse(record);

    if (!parsed.success) {
      throw new Error(
        `${fileName}.json record ${index} did not match the expected shape: ${parsed.error.message}`,
      );
    }

    return parsed.data as z.infer<(typeof fixtureFiles)[TName]>;
  });
};
