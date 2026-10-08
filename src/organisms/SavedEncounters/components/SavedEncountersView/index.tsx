'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { TextInput } from '~/atoms/TextInput';
import { FillStack } from '~/atoms/FillStack';
import { ScrollArea } from '~/atoms/ScrollArea';
import { List } from '~/organisms/SavedEncounters/components/SavedEncountersView/components/List';
import { Card } from '~/atoms/Card';
import { CardHeader } from '~/organisms/SavedEncounters/components/SavedEncountersView/components/CardHeader';
import { PresetName } from '~/organisms/SavedEncounters/components/SavedEncountersView/components/PresetName';
import { MutedCaption } from '~/atoms/MutedCaption';
import { Composition } from '~/organisms/SavedEncounters/components/SavedEncountersView/components/Composition';
import { MutedInline } from '~/atoms/MutedInline';
import { Cluster } from '~/atoms/Cluster';
import { Skeleton } from '~/atoms/Skeleton';

export interface SavedEncounterEntry {
  creatureSlug: string | null;
  customCreatureId: string | null;
  name: string;
  count: number;
  challengeRatingLabel: string;
}

export interface SavedEncounterSummary {
  id: string;
  name: string;
  note: string | null;
  creatureCount: number;
  entries: Array<SavedEncounterEntry>;
}

export interface SavedEncountersViewProps {
  isPending: boolean;
  isSaving: boolean;
  presets: ReadonlyArray<SavedEncounterSummary>;
  /** False when the board holds no monsters — there is nothing to save. */
  canSaveCurrent: boolean;
  onSave: (name: string) => void;
  onApply: (id: string) => void;
  onRemove: (id: string) => void;
}

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
    <FillStack>
      <Cluster as="form" onSubmit={handleSubmit}>
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
      </Cluster>

      <ScrollArea>
        <PresetsBody
          isPending={isPending}
          presets={presets}
          onApply={onApply}
          onRemove={onRemove}
        />
      </ScrollArea>
    </FillStack>
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
    return <Skeleton $height="8rem" aria-label="Loading saved encounters" />;

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
              <MutedCaption>
                {preset.creatureCount}{' '}
                {preset.creatureCount === 1 ? 'creature' : 'creatures'}
              </MutedCaption>
            </CardHeader>

            <Composition>
              {preset.entries.map(entry => (
                <Cluster
                  as="span"
                  key={entry.creatureSlug ?? entry.customCreatureId}
                >
                  {entry.count} × {entry.name}{' '}
                  <MutedInline>CR {entry.challengeRatingLabel}</MutedInline>
                </Cluster>
              ))}
            </Composition>

            <Cluster>
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
            </Cluster>
          </Card>
        </li>
      ))}
    </List>
  );
};
