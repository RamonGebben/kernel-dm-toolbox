'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { CharacterRow } from '~/molecules/CharacterRow';
import {
  CharacterForm,
  type CharacterFormValues,
} from '~/molecules/CharacterForm';

export type RosterCharacter = {
  id: string;
  name: string;
  playerName: string | null;
  level: number;
  armorClass: number;
  maxHitPoints: number;
  initiativeModifier: number;
};

export type CharacterRosterViewProps = {
  isPending: boolean;
  isSaving: boolean;
  characters: readonly RosterCharacter[];
  /** The character being edited, or 'new', or null when the form is closed. */
  editing: RosterCharacter | 'new' | null;
  onStartCreate: () => void;
  onStartEdit: (character: RosterCharacter) => void;
  onCancelEdit: () => void;
  onSubmit: (values: CharacterFormValues) => void;
  onRemove: (id: string) => void;
};

const toFormValues = (character: RosterCharacter): CharacterFormValues => ({
  name: character.name,
  playerName: character.playerName ?? '',
  armorClass: character.armorClass,
  maxHitPoints: character.maxHitPoints,
  initiativeModifier: character.initiativeModifier,
  level: character.level,
});

/** Presentational: props in, JSX out, every state reachable from a story. */
export const CharacterRosterView = ({
  isPending,
  isSaving,
  characters,
  editing,
  onStartCreate,
  onStartEdit,
  onCancelEdit,
  onSubmit,
  onRemove,
}: CharacterRosterViewProps) => (
  <Wrapper>
    {editing ? (
      <CharacterForm
        key={editing === 'new' ? 'new' : editing.id}
        initialValues={editing === 'new' ? undefined : toFormValues(editing)}
        isSaving={isSaving}
        submitLabel={editing === 'new' ? 'Add character' : 'Save changes'}
        onSubmit={onSubmit}
        onCancel={onCancelEdit}
      />
    ) : (
      <Button size="sm" isFullWidth onClick={onStartCreate}>
        Add character
      </Button>
    )}

    <Results>
      <RosterBody
        isPending={isPending}
        characters={characters}
        onStartEdit={onStartEdit}
        onRemove={onRemove}
      />
    </Results>
  </Wrapper>
);

type RosterBodyProps = Pick<
  CharacterRosterViewProps,
  'isPending' | 'characters' | 'onStartEdit' | 'onRemove'
>;

/** A named subcomponent rather than a local const, so the guards stay guards. */
const RosterBody = ({
  isPending,
  characters,
  onStartEdit,
  onRemove,
}: RosterBodyProps) => {
  if (isPending)
    return <Skeleton role="status" aria-label="Loading characters" />;

  if (!characters.length) {
    return (
      <EmptyState
        title="No characters yet"
        description="Add the party once and they are reusable in every fight."
      />
    );
  }

  return (
    <List>
      {characters.map(character => (
        <li key={character.id}>
          <CharacterRow
            name={character.name}
            playerName={character.playerName}
            level={character.level}
            armorClass={character.armorClass}
            maxHitPoints={character.maxHitPoints}
            initiativeModifier={character.initiativeModifier}
            onEdit={() => onStartEdit(character)}
            onRemove={() => onRemove(character.id)}
          />
        </li>
      ))}
    </List>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  height: 100%;
  min-height: 0;
`;

const Results = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Skeleton = styled.div`
  height: 8rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
