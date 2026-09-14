'use client';

import { ClassTemplateWizardView } from '~/organisms/ClassTemplateWizard/components/ClassTemplateWizardView';
import { useClassTemplateWizard } from '~/organisms/ClassTemplateWizard/hooks/useClassTemplateWizard';

type ClassTemplateWizardProps = {
  characterId: string;
  characterName: string;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Connected boundary: owns the class/subclass/level picker and the
 * materialized-combat-data queries and mutations, renders nothing itself.
 * Opened from a "Class" action on a roster row (issue #5, milestone 2).
 */
export const ClassTemplateWizard = ({
  characterId,
  characterName,
  isOpen,
  onClose,
}: ClassTemplateWizardProps) => {
  const wizard = useClassTemplateWizard({ characterId, isOpen });

  return (
    <ClassTemplateWizardView
      isOpen={isOpen}
      onClose={onClose}
      characterName={characterName}
      step={wizard.step}
      isPending={wizard.isPending}
      classes={wizard.classes}
      initialClassSlug={wizard.initialClassSlug}
      initialSubclassSlug={wizard.initialSubclassSlug}
      initialLevel={wizard.initialLevel}
      onSubmitPick={wizard.submitPick}
      isConfirmingOverwrite={wizard.isConfirmingOverwrite}
      onCancelOverwrite={wizard.cancelOverwrite}
      isApplying={wizard.isApplying}
      onConfirmOverwrite={wizard.confirmOverwrite}
      onBackToPick={wizard.backToPick}
      spellOptions={wizard.spellOptions}
      combatDataInitialValues={wizard.combatDataInitialValues}
      isSavingCombatData={wizard.isSavingCombatData}
      onSubmitCombatData={wizard.submitCombatData}
    />
  );
};
