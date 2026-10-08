'use client';

import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import type { TurnActor, TurnDraft } from '~/server/trpc/schemas/bastionTurns';
import { Stack } from '~/atoms/Stack';
import { Heading } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Heading';
import { StepCard } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/StepCard';
import { MutedParagraph } from '~/atoms/MutedParagraph';
import { Paragraph } from '~/atoms/Paragraph';
import { Choice } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/PresenceStep/components/Choice';
import { Hint } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/PresenceStep/components/Hint';

export interface PresenceStepProps {
  context: TurnContext;
  draft: TurnDraft;
  onChange: (draft: TurnDraft) => void;
}

type Plan = 'orders' | 'maintain' | 'away';

const planOf = (actor: TurnActor): Plan => {
  if (!actor.isPresent) return 'away';
  return actor.maintain ? 'maintain' : 'orders';
};

/** What each choice means for the rest of the turn, in the DM's terms. */
const plans: ReadonlyArray<{
  plan: Plan;
  label: string;
  hint: (name: string) => string;
  change: Partial<TurnActor>;
}> = [
  {
    plan: 'orders',
    label: 'Gives orders',
    hint: name =>
      `${name} is at the bastion, or reaches it by Sending. They tell facilities what to do in the next step and roll no Bastion Event.`,
    change: { isPresent: true, maintain: false },
  },
  {
    plan: 'maintain',
    label: 'Maintains',
    hint: name =>
      `${name} is there but gives no orders this turn. Facilities start nothing new, and ${name} rolls one Bastion Event.`,
    change: { isPresent: true, maintain: true, facilityOrders: [] },
  },
  {
    plan: 'away',
    label: 'Away',
    hint: name =>
      `${name} is out of reach. The hirelings keep things running, which counts as maintaining: no orders, and ${name} rolls one Bastion Event.`,
    change: { isPresent: false, facilityOrders: [] },
  },
];

/**
 * Step 2: what each character does with their bastion this turn. Only
 * someone home, or in touch by Sending, can give orders; anyone else
 * maintains, and maintaining is what rolls a Bastion Event.
 */
export const PresenceStep = ({
  context,
  draft,
  onChange,
}: PresenceStepProps) => {
  const setActor = (target: TurnActor, change: Partial<TurnActor>) =>
    onChange({
      ...draft,
      actors: draft.actors.map(actor =>
        actor.bastionId === target.bastionId &&
        actor.characterId === target.characterId
          ? { ...actor, ...change }
          : actor,
      ),
    });

  return (
    <Stack>
      <MutedParagraph>
        Each character either gives orders to facilities this turn or leaves the
        bastion to look after itself. Pick one for everyone.
      </MutedParagraph>
      {context.bastions.map(bastion => (
        <Stack as="section" $gap="s" key={bastion.id} aria-label={bastion.name}>
          <Heading>{bastion.name}</Heading>
          {draft.actors
            .filter(actor => actor.bastionId === bastion.id)
            .map(actor => {
              const name =
                bastion.actors.find(({ id }) => id === actor.characterId)
                  ?.name ?? 'Someone';
              const group = `${bastion.id}-${actor.characterId}`;

              return (
                <StepCard key={group} aria-label={name}>
                  <Paragraph>
                    What does {name} do at {bastion.name} this turn?
                  </Paragraph>
                  {plans.map(({ plan, label, hint, change }) => (
                    <Choice key={plan}>
                      <label>
                        <input
                          type="radio"
                          name={group}
                          checked={planOf(actor) === plan}
                          aria-describedby={`${group}-${plan}`}
                          onChange={() => setActor(actor, change)}
                        />
                        {label}
                      </label>
                      <Hint id={`${group}-${plan}`}>{hint(name)}</Hint>
                    </Choice>
                  ))}
                </StepCard>
              );
            })}
        </Stack>
      ))}
    </Stack>
  );
};
