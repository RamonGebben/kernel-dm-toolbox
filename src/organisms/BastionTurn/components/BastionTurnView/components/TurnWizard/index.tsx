'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { ConfirmButton } from '~/molecules/ConfirmButton';
import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import {
  turnSteps,
  type TurnDraft,
  type TurnStep,
} from '~/server/trpc/schemas/bastionTurns';
import {
  stepAfter,
  stepBefore,
  stepState,
  stepBlocker,
  syncEventsWithActors,
} from '~/organisms/BastionTurn/hooks/useBastionTurn';
import { SinceStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/SinceStep';
import { PresenceStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/PresenceStep';
import { OrdersStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/OrdersStep';
import { EventsStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventsStep';
import {
  ReviewStep,
  type TurnPreview,
} from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep';
import { Stack } from '~/atoms/Stack';
import { Stepper } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Stepper';
import { Step } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Step';
import { Body } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Body';
import { WarningNote } from '~/atoms/WarningNote';
import { ErrorText } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ErrorText';
import { InlineRow } from '~/atoms/InlineRow';
import { Spacer } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Spacer';

export interface TurnWizardProps {
  context: TurnContext;
  initialDraft: TurnDraft;
  isSaving: boolean;
  error: string | null;
  preview: TurnPreview | null;
  isPreviewing: boolean;
  /** Saves the draft — every step change, so a closed tab resumes here. */
  onSave: (draft: TurnDraft) => Promise<unknown>;
  onRequestPreview: (draft: TurnDraft) => void;
  onDiscard: () => void;
  onCommit: () => Promise<unknown>;
}

const stepLabels: Record<TurnStep, string> = {
  since: 'Since last turn',
  presence: "Who's home",
  orders: 'Orders',
  events: 'Bastion Events',
  review: 'Review',
};

/**
 * The guided bastion turn. The DM asks the players, types in what they say
 * and roll, and steps on; nothing changes until the last step's "Commit".
 * The draft is saved at every step, so the turn survives a reload.
 */
export const TurnWizard = ({
  context,
  initialDraft,
  isSaving,
  error,
  preview,
  isPreviewing,
  onSave,
  onRequestPreview,
  onDiscard,
  onCommit,
}: TurnWizardProps) => {
  const [draft, setDraft] = useState(initialDraft);
  const blocker = stepBlocker(draft);

  const goTo = async (step: TurnStep) => {
    const leavingPresence = draft.step === 'presence';
    const moved = {
      ...(leavingPresence ? syncEventsWithActors(draft) : draft),
      step,
    };
    setDraft(moved);
    await onSave(moved);
    if (step === 'review') onRequestPreview(moved);
  };

  const commit = async () => {
    await onSave(draft);
    // A refusal is shown through `error`; the wizard stays where it is.
    await onCommit().catch(() => null);
  };

  const stepProps = { context, draft, onChange: setDraft };

  return (
    <Stack>
      <Stepper aria-label="Bastion turn steps">
        {turnSteps.map((step, index) => (
          <Step
            key={step}
            $state={stepState(step, draft.step)}
            aria-current={step === draft.step ? 'step' : undefined}
          >
            {index + 1}. {stepLabels[step]}
          </Step>
        ))}
      </Stepper>

      <Body>
        <CurrentStep
          step={draft.step}
          stepProps={stepProps}
          preview={preview}
          isPreviewing={isPreviewing}
          treasuryGold={context.treasuryGold}
        />
      </Body>

      {blocker ? <WarningNote role="status">{blocker}</WarningNote> : null}
      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      <InlineRow>
        <ConfirmButton
          label="Discard turn"
          confirmLabel="Discard this turn"
          onConfirm={onDiscard}
        />
        <Spacer />
        <Button
          variant="secondary"
          size="sm"
          disabled={draft.step === 'since' || isSaving}
          onClick={() => void goTo(stepBefore(draft.step))}
        >
          Back
        </Button>
        {draft.step === 'review' ? (
          <Button
            size="sm"
            disabled={isSaving || isPreviewing || !preview?.ok}
            onClick={() => void commit()}
          >
            {isSaving ? 'Committing…' : `Commit turn ${context.turnNumber}`}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={isSaving || Boolean(blocker)}
            onClick={() => void goTo(stepAfter(draft.step))}
          >
            Next: {stepLabels[stepAfter(draft.step)]}
          </Button>
        )}
      </InlineRow>
    </Stack>
  );
};

interface CurrentStepProps {
  step: TurnStep;
  stepProps: {
    context: TurnContext;
    draft: TurnDraft;
    onChange: (draft: TurnDraft) => void;
  };
  preview: TurnPreview | null;
  isPreviewing: boolean;
  treasuryGold: number;
}

/** A named subcomponent rather than a ternary chain, one guard per step. */
const CurrentStep = ({
  step,
  stepProps,
  preview,
  isPreviewing,
  treasuryGold,
}: CurrentStepProps) => {
  if (step === 'since') return <SinceStep {...stepProps} />;
  if (step === 'presence') return <PresenceStep {...stepProps} />;
  if (step === 'orders') return <OrdersStep {...stepProps} />;
  if (step === 'events') return <EventsStep {...stepProps} />;

  return (
    <ReviewStep
      preview={preview}
      isPreviewing={isPreviewing}
      treasuryGold={treasuryGold}
    />
  );
};
