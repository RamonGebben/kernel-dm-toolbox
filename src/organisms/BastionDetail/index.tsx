'use client';

import { BastionDetailView } from '~/organisms/BastionDetail/components/BastionDetailView';
import { useBastionDetail } from '~/organisms/BastionDetail/hooks/useBastionDetail';

/** Connected boundary: the selected bastion's queries and mutations. */
export const BastionDetail = () => {
  const bastion = useBastionDetail();

  return (
    <BastionDetailView
      state={bastion.state}
      treasuryGold={bastion.treasuryGold}
      characters={bastion.characters}
      isSaving={bastion.isSaving}
      error={bastion.error}
      actions={bastion.actions}
    />
  );
};
