'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { TextInput } from '~/atoms/TextInput';

export type SavedEncounterEntry = {
  creatureSlug: string;
  name: string;
  count: number;
  challengeRatingLabel: string;
};

export type SavedEncounterSummary = {
  id: string;
  name: string;
  note: string | null;
  creatureCount: number;
  entries: SavedEncounterEntry[];
};

export type SavedEncountersViewProps = {
  isPending: boolean;
  isSaving: boolean;
  presets: readonly SavedEncounterSummary[];
  /** False when the board holds no monsters — there is nothing to save. */
  canSaveCurrent: boolean;
  onSave: (name: string) => void;
  onApply: (id: string) => void;
  onRemove: (id: string) => void;
};

/**
 * Presentational: saved encounters, and the box that saves the current one.
 *
 * A preset is composition only — which monsters and how many — so the list
 * reads as a recipe rather than as a snapshot of a fight in progress.
 */
export const SavedEncountersView = ({
  isPending,
  isSaving,
  presets,
  canSaveCurrent,
  onSave,
  onApply,
  onRemove,
}: SavedEncountersViewProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    onSave(name.trim());
    setName('');
  };

  return (
    <Wrapper>
      <SaveForm onSubmit={handleSubmit}>
        <TextInput
          value={name}
          placeholder="Name this encounter…"
          aria-label="Name for the saved encounter"
          disabled={!canSaveCurrent}
          onChange={event => setName(event.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!canSaveCurrent || isSaving || !name.trim()}
        >
          Save current
        </Button>
      </SaveForm>

      <Results>
        <PresetsBody
          isPending={isPending}
          presets={presets}
          onApply={onApply}
          onRemove={onRemove}
        />
      </Results>
    </Wrapper>
  );
};

type PresetsBodyProps = Pick<
  SavedEncountersViewProps,
  'isPending' | 'presets' | 'onApply' | 'onRemove'
>;

/** A named subcomponent rather than a local const, so the guards stay guards. */
const PresetsBody = ({
  isPending,
  presets,
  onApply,
  onRemove,
}: PresetsBodyProps) => {
  if (isPending)
    return <Skeleton role="status" aria-label="Loading saved encounters" />;

  if (!presets.length) {
    return (
      <EmptyState
        title="No saved encounters"
        description="Build a fight, then save it here to drop the same monsters in again later."
      />
    );
  }

  return (
    <List>
      {presets.map(preset => (
        <li key={preset.id}>
          <Card>
            <CardHeader>
              <PresetName>{preset.name}</PresetName>
              <Count>
                {preset.creatureCount}{' '}
                {preset.creatureCount === 1 ? 'creature' : 'creatures'}
              </Count>
            </CardHeader>

            <Composition>
              {preset.entries.map(entry => (
                <Line key={entry.creatureSlug}>
                  {entry.count} × {entry.name}{' '}
                  <Cr>CR {entry.challengeRatingLabel}</Cr>
                </Line>
              ))}
            </Composition>

            <Actions>
              <Button
                size="sm"
                onClick={() => onApply(preset.id)}
                aria-label={`Add ${preset.name} to the encounter`}
              >
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(preset.id)}
                aria-label={`Delete ${preset.name}`}
              >
                Delete
              </Button>
            </Actions>
          </Card>
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

const SaveForm = styled.form`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;

const Results = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const PresetName = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.md};
  color: ${props => props.theme.color.textPrimary};
`;

const Count = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Composition = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Line = styled.span`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;

const Cr = styled.span`
  color: ${props => props.theme.color.textMuted};
`;

const Actions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;

const Skeleton = styled.div`
  height: 8rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
