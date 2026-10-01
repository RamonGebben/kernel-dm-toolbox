/**
 * Gold moves in whole gold pieces, and a purse or treasury never goes below
 * zero — a withdrawal larger than the balance is refused, not clamped, so the
 * DM finds out rather than the party silently paying less than the price.
 */
export type GoldChange =
  | { ok: true; balance: number }
  | { ok: false; reason: 'insufficient' | 'not-whole' };

export const applyGoldChange = (balance: number, delta: number): GoldChange => {
  if (!Number.isInteger(delta)) return { ok: false, reason: 'not-whole' };

  const next = balance + delta;
  if (next < 0) return { ok: false, reason: 'insufficient' };

  return { ok: true, balance: next };
};

/** `1,250 gp` — grouped so a hoard reads at a glance. */
export const formatGold = (amount: number): string =>
  `${amount.toLocaleString('en-US')} gp`;
