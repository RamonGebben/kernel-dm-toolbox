'use client';

import styled from 'styled-components';
import { Modal } from '~/atoms/Modal';
import { Button } from '~/atoms/Button';
import {
  CustomCreatureForm,
  type CustomCreatureFormValues,
} from '~/molecules/CustomCreatureForm';
import { BasePicker } from '~/organisms/NewCreatureWizard/components/BasePicker';
import type { CreatureSummary } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';
import type {
  BaseSelection,
  WizardStep,
} from '~/organisms/NewCreatureWizard/hooks/useNewCreatureWizard';

export type NewCreatureWizardViewProps = {
  isOpen: boolean;
  step: WizardStep;
  search: string;
  creatures: readonly CreatureSummary[];
  isBasePickerPending: boolean;
  isBasePending: boolean;
  initialValues: CustomCreatureFormValues | null;
  isSaving: boolean;
  onSearchChange: (search: string) => void;
  onChooseBase: (selection: BaseSelection) => void;
  onBackToPickBase: () => void;
  onSubmit: (values: CustomCreatureFormValues) => void;
  onClose: () => void;
};

/**
 * Presentational: every state (picking a base, waiting on a copy source to
 * load, filling in the form) is reachable from a story because nothing here
 * fetches.
 */
export const NewCreatureWizardView = ({
  isOpen,
  step,
  search,
  creatures,
  isBasePickerPending,
  isBasePending,
  initialValues,
  isSaving,
  onSearchChange,
  onChooseBase,
  onBackToPickBase,
  onSubmit,
  onClose,
}: NewCreatureWizardViewProps) => (
  <Modal
    title="New Creature"
    isOpen={isOpen}
    onClose={onClose}
    size={step === 'form' ? 'wide' : 'default'}
  >
    {step === 'pick-base' && (
      <BasePicker
        search={search}
        onSearchChange={onSearchChange}
        creatures={creatures}
        isPending={isBasePickerPending}
        onChoose={onChooseBase}
      />
    )}

    {step === 'form' && (
      <FormStep>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBackToPickBase}
        >
          ← Back
        </Button>

        {isBasePending || !initialValues ? (
          <Skeleton role="status" aria-label="Loading creature to copy" />
        ) : (
          <CustomCreatureForm
            key={JSON.stringify(initialValues.name)}
            initialValues={initialValues}
            isSaving={isSaving}
            submitLabel="Create Creature"
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        )}
      </FormStep>
    )}
  </Modal>
);

const FormStep = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Skeleton = styled.div`
  height: 12rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
