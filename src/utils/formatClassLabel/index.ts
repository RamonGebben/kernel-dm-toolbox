/**
 * Renders a PC's class the way a character sheet does: "Barbarian 5". Null
 * whenever there's no class yet, so a caller can render a "no class" hint
 * instead of a broken label.
 */
export const formatClassLabel = (
  className: string | null,
  level: number,
): string | null => (className ? `${className} ${level}` : null);
