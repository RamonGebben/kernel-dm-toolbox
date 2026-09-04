import { z } from 'zod';

/**
 * Saving the monsters currently on the board under a name.
 *
 * There is no list of creatures in the input: the encounter on the server is
 * the source of truth for what is being saved, and letting a client send its
 * own idea of the board would be a second, disagreeing one.
 */
export const savePresetInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  note: z.string().trim().max(200).optional(),
});

export type SavePresetInput = z.infer<typeof savePresetInputSchema>;

export const presetIdInputSchema = z.object({ id: z.uuid() });
