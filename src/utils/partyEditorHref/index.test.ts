import { describe, expect, it } from 'vitest';
import {
  buildPartyEditorHref,
  toPartyEditorTarget,
} from '~/utils/partyEditorHref';

const sigrid = { id: 'sigrid-id', name: 'Sigrid' };

describe('buildPartyEditorHref', () => {
  it('links to one character', () => {
    expect(buildPartyEditorHref('sigrid-id')).toBe('/party?edit=sigrid-id');
  });

  it('links to a blank form', () => {
    expect(buildPartyEditorHref('new')).toBe('/party?edit=new');
  });
});

describe('toPartyEditorTarget', () => {
  it('is closed with no parameter', () => {
    expect(toPartyEditorTarget(null, [sigrid])).toEqual({ kind: 'closed' });
  });

  it('opens a blank form for "new", even before the roster loads', () => {
    expect(toPartyEditorTarget('new', undefined)).toEqual({ kind: 'new' });
  });

  it('waits for the roster before resolving an id', () => {
    expect(toPartyEditorTarget('sigrid-id', undefined)).toEqual({
      kind: 'pending',
    });
  });

  it('opens the matching character', () => {
    expect(toPartyEditorTarget('sigrid-id', [sigrid])).toEqual({
      kind: 'edit',
      character: sigrid,
    });
  });

  it('reads an id that matches nobody as closed', () => {
    expect(toPartyEditorTarget('gone', [sigrid])).toEqual({ kind: 'closed' });
  });
});
