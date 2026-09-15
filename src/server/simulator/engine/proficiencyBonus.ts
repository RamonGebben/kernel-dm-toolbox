/**
 * 5e's universal proficiency-bonus-by-level table — +2 at levels 1-4, rising
 * by 1 every four levels to +6 at 17-20. Fixed across every class, unlike
 * `~/content/classProgression`'s per-class content, so this is a plain
 * formula rather than hand-authored lookup content. Clamped to the 1-20
 * range the same way `attacksPerTurnForPc` clamps a PC's level.
 */
export const proficiencyBonusForLevel = (level: number): number => {
  const clamped = Math.min(Math.max(level, 1), 20);
  return 2 + Math.floor((clamped - 1) / 4);
};
