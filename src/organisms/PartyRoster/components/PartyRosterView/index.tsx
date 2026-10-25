'use client';

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
import { Stack } from '~/atoms/Stack';
import { Toolbar } from '~/organisms/PartyRoster/components/PartyRosterView/components/Toolbar';
import { SectionHeading } from '~/organisms/PartyRoster/components/PartyRosterView/components/SectionHeading';
import { List } from '~/organisms/PartyRoster/components/PartyRosterView/components/List';
import { Skeleton } from '~/atoms/Skeleton';

export interface PartyRosterViewProps {
  isPending: boolean;
  active: ReadonlyArray<PartyCharacter>;
  benched: ReadonlyArray<PartyCharacter>;
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
}

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
  <Stack>
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
  </Stack>
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
    return <Skeleton $height="8rem" aria-label="Loading the party" />;

  if (!active.length && !benched.length) {
    return (
      <EmptyState
        title="No party yet"
        description="Add each character once. The tracker picks from this roster for every fight."
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
  characters: ReadonlyArray<PartyCharacter>;
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
