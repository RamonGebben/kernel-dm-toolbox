'use client';

import styled from 'styled-components';
import { TextInput } from '~/atoms/TextInput';
import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import type {
  TurnCompletion,
  TurnDraft,
} from '~/server/trpc/schemas/bastionTurns';

export type SinceStepProps = {
  context: TurnContext;
  draft: TurnDraft;
  onChange: (draft: TurnDraft) => void;
};

/**
 * Step 1: the seven days that just passed. Building work that finishes, work
 * that carries on, facilities back in action — and every job that finished,
 * with a place to record what it produced.
 */
export const SinceStep = ({ context, draft, onChange }: SinceStepProps) => {
  const setCompletion = (facilityId: string, change: Partial<TurnCompletion>) =>
    onChange({
      ...draft,
      completions: draft.completions.map(completion =>
        completion.facilityId === facilityId
          ? { ...completion, ...change }
          : completion,
      ),
    });

  return (
    <Wrapper>
      {context.bastions.map(bastion => {
        const finished = bastion.facilities.filter(f => f.finishesThisTurn);
        const recovering = bastion.facilities.filter(f => f.isOutOfAction);
        const nothing =
          !finished.length &&
          !recovering.length &&
          !bastion.projectsFinishing.length &&
          !bastion.projectsContinuing.length;

        return (
          <Bastion key={bastion.id} aria-label={bastion.name}>
            <Heading>{bastion.name}</Heading>
            {nothing ? (
              <Muted>A quiet week — nothing was under way.</Muted>
            ) : null}

            {bastion.projectsFinishing.map(project => (
              <Line key={project.id}>Finished: {project.description}.</Line>
            ))}
            {bastion.projectsContinuing.map(project => (
              <Line key={project.id}>
                Still building: {project.description} — {project.daysLeftAfter}{' '}
                days to go.
              </Line>
            ))}
            {recovering.map(facility => (
              <Line key={facility.id}>
                The {facility.name} is out of action this turn.
              </Line>
            ))}

            {finished.map(facility => {
              const completion = draft.completions.find(
                ({ facilityId }) => facilityId === facility.id,
              );
              if (!completion) return null;

              return (
                <Completion
                  key={facility.id}
                  aria-label={`${facility.name} finished`}
                >
                  <Line>
                    <strong>{facility.name}</strong> finished{' '}
                    {facility.jobLabel ?? 'its job'}
                    {facility.jobNote ? ` (${facility.jobNote})` : ''}. Ask{' '}
                    {facility.holderName} what came of it.
                  </Line>
                  <Fields>
                    <TextInput
                      aria-label={`What the ${facility.name} produced`}
                      placeholder="Item to store (leave empty for none)"
                      value={completion.itemName}
                      onChange={event =>
                        setCompletion(facility.id, {
                          itemName: event.target.value,
                        })
                      }
                    />
                    <label>
                      How many
                      <Small
                        aria-label={`How many from the ${facility.name}`}
                        type="number"
                        min={1}
                        value={completion.quantity}
                        onChange={event =>
                          setCompletion(facility.id, {
                            quantity: Math.max(
                              1,
                              Number(event.target.value) || 1,
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      Gold earned
                      <Small
                        aria-label={`Gold earned by the ${facility.name}`}
                        type="number"
                        min={0}
                        value={completion.goldGained}
                        onChange={event =>
                          setCompletion(facility.id, {
                            goldGained: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          })
                        }
                      />
                    </label>
                    {facility.order === 'recruit' ? (
                      <label>
                        Defenders joined
                        <Small
                          aria-label={`Defenders recruited by the ${facility.name}`}
                          type="number"
                          min={0}
                          value={completion.defendersGained}
                          onChange={event =>
                            setCompletion(facility.id, {
                              defendersGained: Math.max(
                                0,
                                Number(event.target.value) || 0,
                              ),
                            })
                          }
                        />
                      </label>
                    ) : null}
                  </Fields>
                </Completion>
              );
            })}
          </Bastion>
        );
      })}
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
  gap: ${props => props.theme.space.xs};
`;

const Heading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const Line = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
`;

const Muted = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textMuted};
`;

const Completion = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  padding: ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Fields = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};

  label {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.space.xs};
  }
`;

const Small = styled(TextInput)`
  width: 6rem;
`;
