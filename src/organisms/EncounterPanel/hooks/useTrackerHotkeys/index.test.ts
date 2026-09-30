import { describe, expect, it } from 'vitest';
import { isHotkeyEvent } from '~/organisms/EncounterPanel/hooks/useTrackerHotkeys';

const target = (tagName: string, isContentEditable = false) =>
  ({ tagName, isContentEditable }) as unknown as HTMLElement;

describe('isHotkeyEvent', () => {
  it('accepts a plain keydown on the page body', () => {
    expect(
      isHotkeyEvent({
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        target: target('BODY'),
      }),
    ).toBe(true);
  });

  it('rejects a keydown while typing in a text field', () => {
    expect(
      isHotkeyEvent({
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        target: target('INPUT'),
      }),
    ).toBe(false);
  });

  it('rejects a keydown in a select', () => {
    expect(
      isHotkeyEvent({
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        target: target('SELECT'),
      }),
    ).toBe(false);
  });

  it('rejects a keydown in a contenteditable element', () => {
    expect(
      isHotkeyEvent({
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        target: target('DIV', true),
      }),
    ).toBe(false);
  });

  it('rejects a keydown held with a modifier, so browser shortcuts still work', () => {
    expect(
      isHotkeyEvent({
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        target: target('BODY'),
      }),
    ).toBe(false);
  });
});
