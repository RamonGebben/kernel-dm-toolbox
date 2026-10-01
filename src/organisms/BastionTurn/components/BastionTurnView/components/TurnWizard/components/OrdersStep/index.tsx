'use client';

import styled from 'styled-components';
import { Select } from '~/atoms/FormControls';
import { TextInput } from '~/atoms/TextInput';
import { bastionOrderLabels } from '~/content/bastion/orders';
import type {
  TurnContext,
  TurnContextFacility,
} from '~/server/trpc/helpers/bastionTurnPlan';
import type {
  TurnActor,
  TurnDraft,
  TurnFacilityOrder,
} from '~/server/trpc/schemas/bastionTurns';
import { formatGold } from '~/utils/applyGoldChange';
import { isMaintaining } from '~/utils/bastionTurn';

export type OrdersStepProps = {
  context: TurnContext;
  draft: TurnDraft;
  onChange: (draft: TurnDraft) => void;
};

/** Why a facility cannot take an order this turn, or null when it can. */
const unavailableBecause = (facility: TurnContextFacility): string | null => {
  if (facility.isOutOfAction) return 'Out of action this turn';
  if (facility.isBusy)
    return `Busy: ${facility.jobLabel ?? 'a job'}, ${facility.jobDaysRemaining - 7} days left after this week`;
  return null;
};

/**
 * Step 3: each character at home gives orders to the facilities they hold —
 * in a party bastion, one member at a time. A facility left on "No order"
 * simply idles.
 */
export const OrdersStep = ({ context, draft, onChange }: OrdersStepProps) => {
  const giving = draft.actors.filter(actor => !isMaintaining(actor));

  const setOrder = (
    target: TurnActor,
    facilityId: string,
    order: TurnFacilityOrder | null,
  ) =>
    onChange({
      ...draft,
      actors: draft.actors.map(actor =>
        actor === target
          ? {
              ...actor,
              facilityOrders: [
                ...actor.facilityOrders.filter(
                  o => o.facilityId !== facilityId,
                ),
                ...(order ? [order] : []),
              ],
            }
          : actor,
      ),
    });

  if (!giving.length) {
    return (
      <Muted>
        Nobody is giving orders this turn — everyone maintains. On to the
        Bastion Events.
      </Muted>
    );
  }

  return (
    <Wrapper>
      {giving.map(actor => {
        const bastion = context.bastions.find(
          ({ id }) => id === actor.bastionId,
        );
        if (!bastion) return null;
        const name =
          bastion.actors.find(({ id }) => id === actor.characterId)?.name ??
          'Someone';
        const held = bastion.facilities.filter(
          facility => facility.holderId === actor.characterId,
        );

        return (
          <Actor
            key={`${actor.bastionId}-${actor.characterId}`}
            aria-label={`${name}'s orders`}
          >
            <Heading>
              {name}&apos;s orders
              {bastion.kind === 'character' ? ` · ${bastion.name}` : ''}
            </Heading>
            {held.length ? null : (
              <Muted>{name} holds no special facilities here.</Muted>
            )}
            {held.map(facility => {
              const blocked = unavailableBecause(facility);
              const order = actor.facilityOrders.find(
                ({ facilityId }) => facilityId === facility.id,
              );
              const option = facility.orderOptions.find(
                ({ key }) => key === order?.optionKey,
              );

              return (
                <Facility key={facility.id}>
                  <Row>
                    <FacilityName>
                      {facility.name}{' '}
                      <Muted as="span">
                        · {bastionOrderLabels[facility.order]}
                      </Muted>
                    </FacilityName>
                    {blocked ? (
                      <Muted as="span">{blocked}</Muted>
                    ) : (
                      <Select
                        aria-label={`Order for the ${facility.name}`}
                        value={order?.optionKey ?? ''}
                        onChange={event => {
                          const picked = facility.orderOptions.find(
                            ({ key }) => key === event.target.value,
                          );
                          setOrder(
                            actor,
                            facility.id,
                            picked
                              ? {
                                  facilityId: facility.id,
                                  optionKey: picked.key,
                                  costGp: picked.costGp ?? 0,
                                  note: '',
                                }
                              : null,
                          );
                        }}
                      >
                        <option value="">No order</option>
                        {facility.orderOptions.map(choice => (
                          <option key={choice.key} value={choice.key}>
                            {choice.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Row>
                  {order && option ? (
                    <Detail>
                      <Muted>
                        {option.summary}{' '}
                        {option.durationDays
                          ? `Takes ${option.durationDays} days.`
                          : 'Time per the crafting rules — 7 days unless you change it later.'}
                      </Muted>
                      <Row>
                        <label>
                          Cost (gp)
                          <Small
                            aria-label={`Cost of the ${facility.name} order`}
                            type="number"
                            min={0}
                            value={order.costGp}
                            onChange={event =>
                              setOrder(actor, facility.id, {
                                ...order,
                                costGp: Math.max(
                                  0,
                                  Number(event.target.value) || 0,
                                ),
                              })
                            }
                          />
                        </label>
                        <TextInput
                          aria-label={`Details for the ${facility.name} order`}
                          placeholder="Details — which item, which topic…"
                          value={order.note}
                          onChange={event =>
                            setOrder(actor, facility.id, {
                              ...order,
                              note: event.target.value,
                            })
                          }
                        />
                      </Row>
                      {order.costGp ? (
                        <Muted>
                          Paid from the treasury: {formatGold(order.costGp)}.
                        </Muted>
                      ) : null}
                    </Detail>
                  ) : null}
                </Facility>
              );
            })}
          </Actor>
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

const Actor = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Heading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const Facility = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  padding: ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};

  label {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.space.xs};
  }
`;

const FacilityName = styled.span`
  font-size: ${props => props.theme.fontSize.md};
  color: ${props => props.theme.color.textPrimary};
`;

const Detail = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const Muted = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Small = styled(TextInput)`
  width: 6rem;
`;
