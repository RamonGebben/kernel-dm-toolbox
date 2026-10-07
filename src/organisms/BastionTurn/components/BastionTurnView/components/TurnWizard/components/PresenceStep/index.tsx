'use client';

import styled from 'styled-components';
import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import type { TurnActor, TurnDraft } from '~/server/trpc/schemas/bastionTurns';

export type PresenceStepProps = {
  context: TurnContext;
  draft: TurnDraft;
  onChange: (draft: TurnDraft) => void;
};

type Plan = 'orders' | 'maintain' | 'away';

const planOf = (actor: TurnActor): Plan => {
  if (!actor.isPresent) return 'away';
  return actor.maintain ? 'maintain' : 'orders';
};

/** What each choice means for the rest of the turn, in the DM's terms. */
const plans: readonly {
  plan: Plan;
  label: string;
  hint: (name: string) => string;
  change: Partial<TurnActor>;
}[] = [
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
    <Wrapper>
      <Intro>
        Each character either gives orders to facilities this turn or leaves the
        bastion to look after itself. Pick one for everyone.
      </Intro>
      {context.bastions.map(bastion => (
        <Bastion key={bastion.id} aria-label={bastion.name}>
          <Heading>{bastion.name}</Heading>
          {draft.actors
            .filter(actor => actor.bastionId === bastion.id)
            .map(actor => {
              const name =
                bastion.actors.find(({ id }) => id === actor.characterId)
                  ?.name ?? 'Someone';
              const group = `${bastion.id}-${actor.characterId}`;

              return (
                <Actor key={group} aria-label={name}>
                  <Question>
                    What does {name} do at {bastion.name} this turn?
                  </Question>
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
                </Actor>
              );
            })}
        </Bastion>
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const Bastion = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Heading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const Actor = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  padding: ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Intro = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textMuted};
`;

const Question = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
`;

const Choice = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};

  label {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.space.xs};
  }
`;

const Hint = styled.span`
  padding-left: ${props => props.theme.space.lg};
  color: ${props => props.theme.color.textMuted};
`;
