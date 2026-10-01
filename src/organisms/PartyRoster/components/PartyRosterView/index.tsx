'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { PartyMemberCard } from '~/molecules/PartyMemberCard';
import type { CharacterFormValues } from '~/molecules/CharacterForm';
import { CharacterEditor } from '~/organisms/PartyRoster/components/PartyRosterView/components/CharacterEditor';
import {
  toCharacterFormValues,
  type PartyCharacter,
} from '~/organisms/PartyRoster/hooks/usePartyRoster';
import type { PartyEditorTarget } from '~/utils/partyEditorHref';

export type PartyRosterViewProps = {
  isPending: boolean;
  active: readonly PartyCharacter[];
  benched: readonly PartyCharacter[];
  editor: PartyEditorTarget<PartyCharacter>;
  isSaving: boolean;
  isRemoving: boolean;
  /** The member whose bench/recall is in flight, if any. */
  updatingId: string | null;
  onStartCreate: () => void;
  onStartEdit: (id: string) => void;
  onCloseEditor: () => void;
  onSubmit: (values: CharacterFormValues) => void;
  onToggleActive: (character: PartyCharacter) => void;
  onRemove: (id: string) => void;
};

/** Presentational: props in, JSX out, every state reachable from a story. */
export const PartyRosterView = ({
  isPending,
  active,
  benched,
  editor,
  isSaving,
  isRemoving,
  updatingId,
  onStartCreate,
  onStartEdit,
  onCloseEditor,
  onSubmit,
  onToggleActive,
  onRemove,
}: PartyRosterViewProps) => (
  <Wrapper>
    <Toolbar>
      <Button size="sm" onClick={onStartCreate}>
        Add character
      </Button>
    </Toolbar>

    <RosterBody
      isPending={isPending}
      active={active}
      benched={benched}
      updatingId={updatingId}
      onStartEdit={onStartEdit}
      onToggleActive={onToggleActive}
    />

    <CharacterEditor
      isOpen={editor.kind === 'new' || editor.kind === 'edit'}
      editing={
        editor.kind === 'edit'
          ? {
              id: editor.character.id,
              name: editor.character.name,
              values: toCharacterFormValues(editor.character),
            }
          : null
      }
      isSaving={isSaving}
      isRemoving={isRemoving}
      onSubmit={onSubmit}
      onRemove={onRemove}
      onClose={onCloseEditor}
    />
  </Wrapper>
);

type RosterBodyProps = Pick<
  PartyRosterViewProps,
  | 'isPending'
  | 'active'
  | 'benched'
  | 'updatingId'
  | 'onStartEdit'
  | 'onToggleActive'
>;

/** A named subcomponent rather than a local const, so the guards stay guards. */
const RosterBody = ({
  isPending,
  active,
  benched,
  updatingId,
  onStartEdit,
  onToggleActive,
}: RosterBodyProps) => {
  if (isPending)
    return <Skeleton role="status" aria-label="Loading the party" />;

  if (!active.length && !benched.length) {
    return (
      <EmptyState
        title="No party yet"
        description="Add each character once — the tracker picks from this roster for every fight."
      />
    );
  }

  return (
    <>
      <MemberList
        label="Active members"
        characters={active}
        updatingId={updatingId}
        onStartEdit={onStartEdit}
        onToggleActive={onToggleActive}
      />
      {benched.length ? (
        <>
          <SectionHeading>Benched</SectionHeading>
          <MemberList
            label="Benched members"
            characters={benched}
            updatingId={updatingId}
            onStartEdit={onStartEdit}
            onToggleActive={onToggleActive}
          />
        </>
      ) : null}
    </>
  );
};

type MemberListProps = Pick<
  PartyRosterViewProps,
  'updatingId' | 'onStartEdit' | 'onToggleActive'
> & {
  label: string;
  characters: readonly PartyCharacter[];
};

const MemberList = ({
  label,
  characters,
  updatingId,
  onStartEdit,
  onToggleActive,
}: MemberListProps) => (
  <List aria-label={label}>
    {characters.map(character => (
      <li key={character.id}>
        <PartyMemberCard
          {...character}
          isUpdating={updatingId === character.id}
          onEdit={() => onStartEdit(character.id)}
          onToggleActive={() => onToggleActive(character)}
        />
      </li>
    ))}
  </List>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SectionHeading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.color.textMuted};
`;

const List = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: ${props => props.theme.space.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Skeleton = styled.div`
  height: 8rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
