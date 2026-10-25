'use client';

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
import { Stack } from '~/atoms/Stack';
import { Skeleton } from '~/atoms/Skeleton';

export interface NewCreatureWizardViewProps {
  isOpen: boolean;
  step: WizardStep;
  search: string;
  creatures: ReadonlyArray<CreatureSummary>;
  isBasePickerPending: boolean;
  isBasePending: boolean;
  initialValues: CustomCreatureFormValues | null;
  /** Identifies the base creature by identity (source + slug/id), not by
   * name — see `useNewCreatureWizard`. Used to force `CustomCreatureForm`
   * to remount when the base changes. */
  baseKey: string;
  isSaving: boolean;
  onSearchChange: (search: string) => void;
  onChooseBase: (selection: BaseSelection) => void;
  onBackToPickBase: () => void;
  onSubmit: (values: CustomCreatureFormValues) => void;
  onClose: () => void;
}

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
  baseKey,
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
      <Stack $gap="s">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBackToPickBase}
        >
          ← Back
        </Button>

        {isBasePending || !initialValues ? (
          <Skeleton $height="12rem" aria-label="Loading creature to copy" />
        ) : (
          <CustomCreatureForm
            key={baseKey}
            initialValues={initialValues}
            isSaving={isSaving}
            submitLabel="Create Creature"
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        )}
      </Stack>
    )}
  </Modal>
);
