import { describe, expect, it } from 'vitest';
import { formatWinnerLabel } from '~/utils/formatWinnerLabel';

describe('formatWinnerLabel', () => {
  it('labels each outcome', () => {
    expect(formatWinnerLabel('party')).toBe('The party wins!');
    expect(formatWinnerLabel('monsters')).toBe('The monsters win!');
    expect(formatWinnerLabel('draw')).toBe("It's a draw.");
  });
});
