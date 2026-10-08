'use client';

import { BastionListView } from '~/organisms/BastionList/components/BastionListView';
import { useBastionList } from '~/organisms/BastionList/hooks/useBastionList';

/** Connected boundary: the bastion list and founding, rendered by the view. */
export const BastionList = () => {
  const list = useBastionList();

  return (
    <BastionListView
      isPending={list.isPending}
      mode={list.mode}
      bastions={list.bastions}
      selectedId={list.selectedId}
      foundable={list.foundable}
      canFound={list.canFound}
      activeMembers={list.activeMembers}
      isFounding={list.isFounding}
      foundError={list.foundError}
      isSwitching={list.isSwitching}
      switchError={list.switchError}
      onSelect={list.select}
      onFound={list.found}
      onSwitchMode={list.setMode}
    />
  );
};
