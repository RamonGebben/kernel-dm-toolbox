import { expect, type APIRequestContext } from '@playwright/test';

/** A per-test name: the roster is persistent and the specs share one database. */
export const uniqueName = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

type NewCharacter = {
  name: string;
  level?: number;
  armorClass?: number;
  maxHitPoints?: number;
};

/**
 * Puts a character on the party roster through the API.
 *
 * Creating characters is the Party page's job and has its own spec; a spec
 * about running a fight only needs one to exist, so it should not be at the
 * mercy of that form's layout.
 */
export const createCharacter = async (
  request: APIRequestContext,
  baseURL: string,
  { name, level = 1, armorClass = 15, maxHitPoints = 30 }: NewCharacter,
): Promise<void> => {
  const response = await request.post(`${baseURL}/api/trpc/characters.create`, {
    data: { json: { name, level, armorClass, maxHitPoints } },
  });

  expect(response.ok()).toBe(true);
};
