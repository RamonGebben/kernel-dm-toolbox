'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { Modal } from '~/atoms/Modal';
import type { FoundableCharacter } from '~/utils/bastionSelection';
import {
  FoundBastionForm,
  type FoundBastionValues,
} from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm';
import {
  BastionModeSwitch,
  type ModeChange,
} from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch';
import type { BastionMode } from '~/server/db/schema';
import { Stack } from '~/atoms/Stack';
import { PlainList } from '~/atoms/PlainList';
import { Item } from '~/organisms/BastionList/components/BastionListView/components/Item';
import { Name } from '~/organisms/BastionList/components/BastionListView/components/Name';
import { MutedCaption } from '~/atoms/MutedCaption';
import { Skeleton } from '~/atoms/Skeleton';

export interface BastionListItem {
  id: string;
  name: string;
  kind: 'character' | 'party';
  ownerName: string | null;
  ownerLevel: number | null;
  memberCount: number;
  specialFacilityCount: number;
  allowance: number;
}

export interface BastionListViewProps {
  isPending: boolean;
  mode: BastionMode;
  bastions: ReadonlyArray<BastionListItem>;
  selectedId: string | null;
  foundable: ReadonlyArray<FoundableCharacter>;
  /** False once the party already has its one bastion. */
  canFound: boolean;
  activeMembers: ReadonlyArray<{ id: string; name: string }>;
  isFounding: boolean;
  foundError: string | null;
  isSwitching: boolean;
  switchError: string | null;
  onSelect: (id: string) => void;
  /** Resolves once founded, so the dialog knows to close. */
  onFound: (values: FoundBastionValues) => Promise<unknown>;
  onSwitchMode: (change: ModeChange) => Promise<unknown>;
}

/** "Sigrid · level 9 · 3/4 facilities", or "The party · 3 members · 5/10 facilities". */
const describeItem = (bastion: BastionListItem): string => {
  const facilities = `${bastion.specialFacilityCount}/${bastion.allowance} facilities`;

  return bastion.kind === 'party'
    ? `The party · ${bastion.memberCount} member${bastion.memberCount === 1 ? '' : 's'} · ${facilities}`
    : `${bastion.ownerName} · level ${bastion.ownerLevel} · ${facilities}`;
};

/** Presentational: every character's bastion, and founding a new one. */
export const BastionListView = ({
  isPending,
  mode,
  bastions,
  selectedId,
  foundable,
  canFound,
  activeMembers,
  isFounding,
  foundError,
  isSwitching,
  switchError,
  onSelect,
  onFound,
  onSwitchMode,
}: BastionListViewProps) => {
  const [isFoundOpen, setIsFoundOpen] = useState(false);

  const found = async (values: FoundBastionValues) => {
    try {
      await onFound(values);
      setIsFoundOpen(false);
    } catch {
      // The error is shown in the form via `foundError`; keep it open.
    }
  };

  return (
    <Stack>
      <BastionModeSwitch
        mode={mode}
        bastionCount={bastions.length}
        suggestedName={bastions[0]?.name ?? "The Party's Bastion"}
        members={activeMembers}
        isSwitching={isSwitching}
        error={switchError}
        onSwitch={onSwitchMode}
      />

      {canFound ? (
        <Button size="sm" isFullWidth onClick={() => setIsFoundOpen(true)}>
          {mode === 'party' ? 'Found the party bastion' : 'Found a bastion'}
        </Button>
      ) : null}

      <ListBody
        isPending={isPending}
        bastions={bastions}
        selectedId={selectedId}
        onSelect={onSelect}
      />

      <Modal
        title="Found a bastion"
        isOpen={isFoundOpen}
        onClose={() => setIsFoundOpen(false)}
      >
        <FoundBastionForm
          mode={mode}
          characters={foundable}
          isSaving={isFounding}
          error={foundError}
          onSubmit={found}
          onCancel={() => setIsFoundOpen(false)}
        />
      </Modal>
    </Stack>
  );
};

type ListBodyProps = Pick<
  BastionListViewProps,
  'isPending' | 'bastions' | 'selectedId' | 'onSelect'
>;

const ListBody = ({
  isPending,
  bastions,
  selectedId,
  onSelect,
}: ListBodyProps) => {
  if (isPending)
    return <Skeleton $height="6rem" aria-label="Loading bastions" />;

  if (!bastions.length) {
    return (
      <EmptyState
        title="No bastions yet"
        description="A character gains a bastion at level 5. Found one for them here."
      />
    );
  }

  return (
    <PlainList aria-label="Bastions">
      {bastions.map(bastion => (
        <li key={bastion.id}>
          <Item
            type="button"
            aria-current={bastion.id === selectedId ? 'true' : undefined}
            $isSelected={bastion.id === selectedId}
            onClick={() => onSelect(bastion.id)}
          >
            <Name>{bastion.name}</Name>
            <MutedCaption>{describeItem(bastion)}</MutedCaption>
          </Item>
        </li>
      ))}
    </PlainList>
  );
};
