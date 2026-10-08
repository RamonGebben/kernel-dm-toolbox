'use client';

import { TextInput } from '~/atoms/TextInput';
import type {
  TurnContext,
  TurnContextFacility,
} from '~/server/trpc/helpers/bastionTurnPlan';
import type {
  TurnCompletion,
  TurnDraft,
} from '~/server/trpc/schemas/bastionTurns';
import { Stack } from '~/atoms/Stack';
import { Heading } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Heading';
import { Paragraph } from '~/atoms/Paragraph';
import { MutedParagraph } from '~/atoms/MutedParagraph';
import { StepCard } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/StepCard';
import { Fields } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/SinceStep/components/Fields';
import { Small } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Small';

export interface SinceStepProps {
  context: TurnContext;
  draft: TurnDraft;
  onChange: (draft: TurnDraft) => void;
}

/**
 * What a finished job came to, so the DM is not left guessing what to type.
 * Where the turn already knows (a Storehouse, a fixed output) it says the
 * fields are filled in; otherwise it repeats what the order can produce.
 */
const describeResult = (facility: TurnContextFacility): string => {
  if (facility.jobEffect === 'buy-goods')
    return 'The goods it bought are filled in below at what was paid. They go to storage, where a later Sell goods order can sell them.';
  if (facility.jobEffect === 'sell-goods')
    return 'The sale is filled in below as gold earned. The goods left storage when the order was given.';
  if (facility.jobEffect === 'recruit-defenders')
    return 'The recruits ordered last turn are filled in below and join the roster when this turn is committed.';
  if (facility.jobEffect === 'stock-armory')
    return 'The Armory is stocked from now on. Nothing to store.';
  if (facility.jobYields)
    return `${facility.jobSummary ?? ''} Filled in below; change it if the table agreed otherwise.`.trim();

  return `${facility.jobSummary ?? ''} Ask ${facility.holderName} what came of it and fill it in below.`.trim();
};

type CompletionField = 'item' | 'gold' | 'defenders';

/**
 * Which results a finished job can have, so the DM is only asked for those:
 * a Barrack brings defenders and nothing else, a sale brings gold, a stocked
 * Armory brings nothing to record at all.
 */
export const fieldsFor = (
  facility: Pick<TurnContextFacility, 'order' | 'jobEffect'>,
): ReadonlySet<CompletionField> => {
  if (facility.jobEffect === 'recruit-defenders') return new Set(['defenders']);
  if (facility.jobEffect === 'stock-armory') return new Set();
  if (facility.jobEffect === 'buy-goods') return new Set(['item']);
  if (facility.jobEffect === 'sell-goods') return new Set(['gold']);
  if (facility.order === 'empower') return new Set();
  if (facility.order === 'trade') return new Set(['item', 'gold']);
  if (facility.order === 'recruit') return new Set(['item', 'defenders']);

  return new Set(['item']);
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
    <Stack>
      {context.bastions.map(bastion => {
        const finished = bastion.facilities.filter(f => f.finishesThisTurn);
        const recovering = bastion.facilities.filter(f => f.isOutOfAction);
        const nothing =
          !finished.length &&
          !recovering.length &&
          !bastion.projectsFinishing.length &&
          !bastion.projectsContinuing.length;

        return (
          <Stack
            as="section"
            $gap="xs"
            key={bastion.id}
            aria-label={bastion.name}
          >
            <Heading>{bastion.name}</Heading>
            {nothing ? (
              <MutedParagraph>
                A quiet week: nothing was under way.
              </MutedParagraph>
            ) : null}

            {bastion.projectsFinishing.map(project => (
              <Paragraph key={project.id}>
                Finished: {project.description}.
              </Paragraph>
            ))}
            {bastion.projectsContinuing.map(project => (
              <Paragraph key={project.id}>
                Still building: {project.description}, {project.daysLeftAfter}{' '}
                days to go.
              </Paragraph>
            ))}
            {recovering.map(facility => (
              <Paragraph key={facility.id}>
                The {facility.name} is out of action this turn.
              </Paragraph>
            ))}

            {finished.map(facility => {
              const completion = draft.completions.find(
                ({ facilityId }) => facilityId === facility.id,
              );
              if (!completion) return null;
              const fields = fieldsFor(facility);

              return (
                <StepCard
                  key={facility.id}
                  aria-label={`${facility.name} finished`}
                >
                  <Paragraph>
                    <strong>{facility.name}</strong> finished{' '}
                    {facility.jobLabel ?? 'its job'}
                    {facility.jobNote ? ` (${facility.jobNote})` : ''}.
                  </Paragraph>
                  <MutedParagraph>{describeResult(facility)}</MutedParagraph>
                  {fields.size ? (
                    <Fields>
                      {fields.has('item') ? (
                        <>
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
                        </>
                      ) : null}
                      {fields.has('gold') ? (
                        <>
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
                        </>
                      ) : null}
                      {facility.jobEffect === 'buy-goods' ? (
                        <label>
                          Worth (gp)
                          <Small
                            aria-label={`What the goods from the ${facility.name} are worth`}
                            type="number"
                            min={0}
                            value={completion.valueGp ?? 0}
                            onChange={event =>
                              setCompletion(facility.id, {
                                valueGp: Math.max(
                                  0,
                                  Number(event.target.value) || 0,
                                ),
                              })
                            }
                          />
                        </label>
                      ) : null}
                      {fields.has('defenders') ? (
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
                  ) : null}
                </StepCard>
              );
            })}
          </Stack>
        );
      })}
    </Stack>
  );
};
