'use client';

import { PartyTreasuryView } from '~/organisms/PartyTreasury/components/PartyTreasuryView';
import { usePartyTreasury } from '~/organisms/PartyTreasury/hooks/usePartyTreasury';

/** Connected boundary: owns the party query and the treasury mutation. */
export const PartyTreasury = () => {
  const treasury = usePartyTreasury();

  return (
    <PartyTreasuryView
      isPending={treasury.isPending}
      balance={treasury.balance}
      isSaving={treasury.isSaving}
      onMove={treasury.move}
    />
  );
};
