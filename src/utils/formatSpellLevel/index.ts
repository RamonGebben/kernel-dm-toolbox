const ORDINAL_SUFFIXES: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };

const ordinalSuffix = (level: number): string => {
  if (level % 100 >= 11 && level % 100 <= 13) return 'th';
  return ORDINAL_SUFFIXES[level % 10] ?? 'th';
};

/** `0` renders as `Cantrip`, everything else as `1st-level`, `2nd-level`, … */
export const formatSpellLevel = (level: number): string => {
  if (level <= 0) return 'Cantrip';
  return `${level}${ordinalSuffix(level)}-level`;
};
