'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '~/atoms/Modal';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { TextInput } from '~/atoms/TextInput';
import { Field, Label, Select } from '~/molecules/CustomCreatureForm/styled';
import {
  PlayerCharacterCombatDataForm,
  type PlayerCharacterCombatDataFormValues,
  type SpellOption,
} from '~/molecules/PlayerCharacterCombatDataForm';
import type { PickSubmission } from '~/organisms/ClassTemplateWizard/hooks/useClassTemplateWizard';

export type ClassOption = {
  slug: string;
  name: string;
  subclassOfSlug: string | null;
};

export type ClassTemplateWizardViewProps = {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
  step: 'pick' | 'edit';
  isPending: boolean;
  classes: readonly ClassOption[];
  initialClassSlug: string;
  initialSubclassSlug: string;
  initialLevel: number;
  onSubmitPick: (submission: PickSubmission) => void;
  isConfirmingOverwrite: boolean;
  onCancelOverwrite: () => void;
  isApplying: boolean;
  onConfirmOverwrite: () => void;
  onBackToPick: () => void;
  spellOptions: readonly SpellOption[];
  combatDataInitialValues: PlayerCharacterCombatDataFormValues | null;
  isSavingCombatData: boolean;
  onSubmitCombatData: (values: PlayerCharacterCombatDataFormValues) => void;
};

/** Presentational: props in, JSX out, every state reachable from a story. */
export const ClassTemplateWizardView = ({
  isOpen,
  onClose,
  characterName,
  step,
  isPending,
  classes,
  initialClassSlug,
  initialSubclassSlug,
  initialLevel,
  onSubmitPick,
  isConfirmingOverwrite,
  onCancelOverwrite,
  isApplying,
  onConfirmOverwrite,
  onBackToPick,
  spellOptions,
  combatDataInitialValues,
  isSavingCombatData,
  onSubmitCombatData,
}: ClassTemplateWizardViewProps) => (
  <Modal
    title={`${characterName} — Class`}
    isOpen={isOpen}
    onClose={onClose}
    size="wide"
  >
    <Body>
      {isPending ? (
        <Skeleton role="status" aria-label="Loading class data" />
      ) : step === 'pick' ? (
        <PickStep
          key={`${initialClassSlug}:${initialSubclassSlug}:${initialLevel}`}
          classes={classes}
          initialClassSlug={initialClassSlug}
          initialSubclassSlug={initialSubclassSlug}
          initialLevel={initialLevel}
          onSubmit={onSubmitPick}
          isConfirmingOverwrite={isConfirmingOverwrite}
          onCancelOverwrite={onCancelOverwrite}
          isApplying={isApplying}
          onConfirmOverwrite={onConfirmOverwrite}
        />
      ) : (
        <EditStep
          onBackToPick={onBackToPick}
          spellOptions={spellOptions}
          combatDataInitialValues={combatDataInitialValues}
          isSavingCombatData={isSavingCombatData}
          onSubmitCombatData={onSubmitCombatData}
        />
      )}
    </Body>
  </Modal>
);

type PickStepProps = {
  classes: readonly ClassOption[];
  initialClassSlug: string;
  initialSubclassSlug: string;
  initialLevel: number;
  onSubmit: (submission: PickSubmission) => void;
  isConfirmingOverwrite: boolean;
  onCancelOverwrite: () => void;
  isApplying: boolean;
  onConfirmOverwrite: () => void;
};

/**
 * Uncontrolled, like `CustomCreatureForm`: owns its own class/subclass/level
 * draft, seeded once from `initialClassSlug`/etc. and reported on submit.
 * The parent remounts it (via a `key`) whenever the underlying character
 * data actually changes, rather than syncing local state from props through
 * an effect.
 */
const PickStep = ({
  classes,
  initialClassSlug,
  initialSubclassSlug,
  initialLevel,
  onSubmit,
  isConfirmingOverwrite,
  onCancelOverwrite,
  isApplying,
  onConfirmOverwrite,
}: PickStepProps) => {
  const [classSlug, setClassSlug] = useState(initialClassSlug);
  const [subclassSlug, setSubclassSlug] = useState(initialSubclassSlug);
  const [level, setLevel] = useState(initialLevel);

  const baseClasses = classes.filter(option => option.subclassOfSlug === null);
  const subclassOptions = classes.filter(
    option => option.subclassOfSlug === classSlug,
  );

  if (!baseClasses.length) {
    return (
      <EmptyState
        title="No classes imported yet"
        description="The class library hasn't imported yet, or the boot import couldn't reach GitHub. Try again once the library has loaded — check the toolbox's creature library for the same signal."
      />
    );
  }

  return (
    <PickWrapper>
      <Field>
        <Label htmlFor="class-wizard-class">Class</Label>
        <Select
          id="class-wizard-class"
          value={classSlug}
          onChange={event => {
            setClassSlug(event.target.value);
            setSubclassSlug('');
          }}
        >
          <option value="" disabled>
            Choose a class…
          </option>
          {baseClasses.map(option => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </Select>
      </Field>

      {subclassOptions.length > 0 && (
        <Field>
          <Label htmlFor="class-wizard-subclass">Subclass</Label>
          <Select
            id="class-wizard-subclass"
            value={subclassSlug}
            onChange={event => setSubclassSlug(event.target.value)}
          >
            <option value="">None yet</option>
            {subclassOptions.map(option => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field>
        <Label htmlFor="class-wizard-level">Level</Label>
        <TextInput
          id="class-wizard-level"
          type="number"
          min={1}
          max={20}
          value={level}
          onChange={event => setLevel(Number(event.target.value) || 1)}
        />
      </Field>

      {isConfirmingOverwrite ? (
        <ConfirmBox role="alert">
          <p>
            This replaces every action, spell, spell slot and resource already
            saved on this character with the new template. This cannot be
            undone.
          </p>
          <ConfirmActions>
            <Button
              type="button"
              onClick={onConfirmOverwrite}
              disabled={isApplying}
            >
              {isApplying ? 'Applying…' : 'Yes, overwrite'}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancelOverwrite}>
              Cancel
            </Button>
          </ConfirmActions>
        </ConfirmBox>
      ) : (
        <Button
          type="button"
          disabled={!classSlug || isApplying}
          onClick={() => onSubmit({ classSlug, subclassSlug, level })}
        >
          {isApplying ? 'Applying…' : 'Apply'}
        </Button>
      )}
    </PickWrapper>
  );
};

type EditStepProps = Pick<
  ClassTemplateWizardViewProps,
  | 'spellOptions'
  | 'combatDataInitialValues'
  | 'isSavingCombatData'
  | 'onSubmitCombatData'
> & { onBackToPick: () => void };

const EditStep = ({
  onBackToPick,
  spellOptions,
  combatDataInitialValues,
  isSavingCombatData,
  onSubmitCombatData,
}: EditStepProps) => (
  <EditWrapper>
    <Button type="button" variant="ghost" size="sm" onClick={onBackToPick}>
      ← Change class
    </Button>

    <PlayerCharacterCombatDataForm
      key={combatDataInitialValues ? 'loaded' : 'loading'}
      initialValues={combatDataInitialValues ?? undefined}
      isSaving={isSavingCombatData}
      availableSpells={spellOptions}
      onSubmit={onSubmitCombatData}
    />
  </EditWrapper>
);

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  max-height: 70vh;
  overflow-y: auto;
`;

const PickWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const EditWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const ConfirmBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.surfaceRaised};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};

  p {
    margin: 0;
  }
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;

const Skeleton = styled.div`
  height: 12rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
