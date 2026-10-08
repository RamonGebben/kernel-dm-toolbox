'use client';

import { PartyRosterView } from '~/organisms/PartyRoster/components/PartyRosterView';
import { usePartyRoster } from '~/organisms/PartyRoster/hooks/usePartyRoster';

/**
 * Connected boundary: owns the roster query, the mutations and the URL-driven
 * editor (`?edit=`), renders nothing itself.
 */
export const PartyRoster = () => {
  const roster = usePartyRoster();

  return (
    <PartyRosterView
      isPending={roster.isPending}
      active={roster.active}
      benched={roster.benched}
      editor={roster.editor}
      isSaving={roster.isSaving}
      isRemoving={roster.isRemoving}
      updatingId={roster.updatingId}
      onStartCreate={roster.startCreate}
      onStartEdit={roster.startEdit}
      onCloseEditor={roster.closeEditor}
      onSubmit={roster.submit}
      onToggleActive={roster.toggleActive}
      onRemove={roster.remove}
    />
  );
};
