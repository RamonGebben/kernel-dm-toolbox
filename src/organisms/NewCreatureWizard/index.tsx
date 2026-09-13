'use client';

import { NewCreatureWizardView } from '~/organisms/NewCreatureWizard/components/NewCreatureWizardView';
import { useNewCreatureWizard } from '~/organisms/NewCreatureWizard/hooks/useNewCreatureWizard';

type NewCreatureWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

/**
 * Connected boundary for the "New Creature" flow (issue #3): step 1 picks a
 * base (blank, or a library/custom creature to copy), step 2 is the
 * structured form. Delegates every pixel to `NewCreatureWizardView`.
 */
export const NewCreatureWizard = ({
  isOpen,
  onClose,
  onCreated,
}: NewCreatureWizardProps) => {
  const wizard = useNewCreatureWizard({ onCreated });

  const handleClose = () => {
    wizard.reset();
    onClose();
  };

  return (
    <NewCreatureWizardView
      isOpen={isOpen}
      step={wizard.step}
      search={wizard.search}
      creatures={wizard.creatures}
      isBasePickerPending={wizard.isBasePickerPending}
      isBasePending={wizard.isBasePending}
      initialValues={wizard.initialValues}
      isSaving={wizard.isSaving}
      onSearchChange={wizard.setSearch}
      onChooseBase={wizard.chooseBase}
      onBackToPickBase={wizard.backToPickBase}
      onSubmit={wizard.submit}
      onClose={handleClose}
    />
  );
};
