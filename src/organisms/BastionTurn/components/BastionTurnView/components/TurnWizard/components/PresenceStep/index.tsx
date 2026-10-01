'use client';

import styled from 'styled-components';
import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import type { TurnActor, TurnDraft } from '~/server/trpc/schemas/bastionTurns';

export type PresenceStepProps = {
  context: TurnContext;
  draft: TurnDraft;
  onChange: (draft: TurnDraft) => void;
};

/**
 * Step 2: who is at their bastion. Only someone home — or in touch by
 * Sending — can give orders; anyone away maintains, and rolls a Bastion
 * Event. Someone home may choose to maintain too.
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
                    Is {name} at {bastion.name}, or in touch by <em>Sending</em>
                    ?
                  </Question>
                  <Choices>
                    <label>
                      <input
                        type="radio"
                        name={`${group}-presence`}
                        checked={actor.isPresent}
                        onChange={() => setActor(actor, { isPresent: true })}
                      />
                      Home
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`${group}-presence`}
                        checked={!actor.isPresent}
                        onChange={() =>
                          setActor(actor, {
                            isPresent: false,
                            facilityOrders: [],
                          })
                        }
                      />
                      Away — the bastion is maintained
                    </label>
                  </Choices>
                  {actor.isPresent ? (
                    <Choices>
                      <label>
                        <input
                          type="radio"
                          name={`${group}-plan`}
                          checked={!actor.maintain}
                          onChange={() => setActor(actor, { maintain: false })}
                        />
                        Gives orders to their facilities
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`${group}-plan`}
                          checked={actor.maintain}
                          onChange={() =>
                            setActor(actor, {
                              maintain: true,
                              facilityOrders: [],
                            })
                          }
                        />
                        Maintains — no orders, one Bastion Event roll
                      </label>
                    </Choices>
                  ) : null}
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

const Question = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
`;

const Choices = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.md};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};

  label {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.space.xs};
  }
`;
