'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { Modal } from '~/atoms/Modal';
import type { FoundableCharacter } from '~/utils/bastionSelection';
import {
  FoundBastionForm,
  type FoundBastionValues,
} from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm';

export type BastionListItem = {
  id: string;
  name: string;
  ownerName: string;
  ownerLevel: number;
  specialFacilityCount: number;
  allowance: number;
};

export type BastionListViewProps = {
  isPending: boolean;
  bastions: readonly BastionListItem[];
  selectedId: string | null;
  foundable: readonly FoundableCharacter[];
  isFounding: boolean;
  foundError: string | null;
  onSelect: (id: string) => void;
  /** Resolves once founded, so the dialog knows to close. */
  onFound: (values: FoundBastionValues) => Promise<unknown>;
};

/** Presentational: every character's bastion, and founding a new one. */
export const BastionListView = ({
  isPending,
  bastions,
  selectedId,
  foundable,
  isFounding,
  foundError,
  onSelect,
  onFound,
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
    <Wrapper>
      <Button size="sm" isFullWidth onClick={() => setIsFoundOpen(true)}>
        Found a bastion
      </Button>

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
          characters={foundable}
          isSaving={isFounding}
          error={foundError}
          onSubmit={found}
          onCancel={() => setIsFoundOpen(false)}
        />
      </Modal>
    </Wrapper>
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
    return <Skeleton role="status" aria-label="Loading bastions" />;

  if (!bastions.length) {
    return (
      <EmptyState
        title="No bastions yet"
        description="A character gains a bastion at level 5. Found one for them here."
      />
    );
  }

  return (
    <List aria-label="Bastions">
      {bastions.map(bastion => (
        <li key={bastion.id}>
          <Item
            type="button"
            aria-current={bastion.id === selectedId ? 'true' : undefined}
            $isSelected={bastion.id === selectedId}
            onClick={() => onSelect(bastion.id)}
          >
            <Name>{bastion.name}</Name>
            <Meta>
              {bastion.ownerName} · level {bastion.ownerLevel} ·{' '}
              {bastion.specialFacilityCount}/{bastion.allowance} facilities
            </Meta>
          </Item>
        </li>
      ))}
    </List>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Item = styled.button<{ $isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  text-align: left;
  background: ${props =>
    props.$isSelected
      ? props.theme.color.surfaceRaised
      : props.theme.color.canvas};
  border: 1px solid
    ${props =>
      props.$isSelected ? props.theme.color.accent : props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: inherit;
  font: inherit;
  cursor: pointer;
`;

const Name = styled.span`
  color: ${props => props.theme.color.textPrimary};
`;

const Meta = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Skeleton = styled.div`
  height: 6rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
