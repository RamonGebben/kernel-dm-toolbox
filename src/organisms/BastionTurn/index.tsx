'use client';

import { BastionTurnView } from '~/organisms/BastionTurn/components/BastionTurnView';
import { useBastionTurn } from '~/organisms/BastionTurn/hooks/useBastionTurn';

/** Connected boundary: the bastion turn's queries and mutations. */
export const BastionTurn = () => {
  const turn = useBastionTurn();

  return (
    <BastionTurnView
      isPending={turn.isPending}
      context={turn.context}
      turn={turn.turn}
      history={turn.history}
      isSaving={turn.isSaving}
      error={turn.error}
      preview={turn.preview}
      isPreviewing={turn.isPreviewing}
      onStart={turn.start}
      onSave={turn.save}
      onRequestPreview={turn.requestPreview}
      onDiscard={turn.discard}
      onCommit={turn.commit}
    />
  );
};
