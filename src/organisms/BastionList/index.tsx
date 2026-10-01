'use client';

import { BastionListView } from '~/organisms/BastionList/components/BastionListView';
import { useBastionList } from '~/organisms/BastionList/hooks/useBastionList';

/** Connected boundary: the bastion list and founding, rendered by the view. */
export const BastionList = () => {
  const list = useBastionList();

  return (
    <BastionListView
      isPending={list.isPending}
      bastions={list.bastions}
      selectedId={list.selectedId}
      foundable={list.foundable}
      isFounding={list.isFounding}
      foundError={list.foundError}
      onSelect={list.select}
      onFound={list.found}
    />
  );
};
