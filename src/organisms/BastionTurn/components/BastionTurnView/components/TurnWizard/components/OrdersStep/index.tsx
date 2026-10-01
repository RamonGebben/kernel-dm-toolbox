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
  TurnDraft,
  TurnFacilityOrder,
} from '~/server/trpc/schemas/bastionTurns';
import { formatGold } from '~/utils/applyGoldChange';
import { isMaintaining } from '~/utils/bastionTurn';
import {
  findFacilityOrder,
  setFacilityOrder,
} from '~/organisms/BastionTurn/hooks/useBastionTurn';

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
 * Step 3: orders, facility by facility. Every facility in a bastion is there
 * for everyone (DECISIONS #34), so whoever is home can give it its one order
 * this turn — the DM picks who when more than one is. A facility left on
 * "No order" idles.
 */
export const OrdersStep = ({ context, draft, onChange }: OrdersStepProps) => {
  const ordering = (bastionId: string) =>
    draft.actors.filter(
      actor => actor.bastionId === bastionId && !isMaintaining(actor),
    );
  const bastions = context.bastions.filter(
    bastion => ordering(bastion.id).length > 0,
  );

  if (!bastions.length) {
    return (
      <Muted>
        Nobody is giving orders this turn — everyone maintains. On to the
        Bastion Events.
      </Muted>
    );
  }

  return (
    <Wrapper>
      {bastions.map(bastion => {
        const home = ordering(bastion.id).map(actor => ({
          id: actor.characterId,
          name:
            bastion.actors.find(({ id }) => id === actor.characterId)?.name ??
            'Someone',
        }));

        return (
          <Actor key={bastion.id} aria-label={`Orders for ${bastion.name}`}>
            <Heading>
              {bastion.name}
              <Muted as="span">
                {' '}
                · giving orders: {home.map(({ name }) => name).join(', ')}
              </Muted>
            </Heading>
            {bastion.facilities.length ? null : (
              <Muted>There are no special facilities here yet.</Muted>
            )}
            {bastion.facilities.map(facility => (
              <FacilityOrder
                key={facility.id}
                facility={facility}
                home={home}
                current={findFacilityOrder(draft, facility.id)}
                onChange={order =>
                  onChange(
                    setFacilityOrder(draft, bastion.id, facility.id, order),
                  )
                }
              />
            ))}
          </Actor>
        );
      })}
    </Wrapper>
  );
};

type FacilityOrderProps = {
  facility: TurnContextFacility;
  /** Who is home to give it an order. */
  home: readonly { id: string; name: string }[];
  current: { characterId: string; order: TurnFacilityOrder } | null;
  onChange: (
    order: { characterId: string; order: TurnFacilityOrder } | null,
  ) => void;
};

/** One facility's order: what it does, and — if several are home — who said so. */
const FacilityOrder = ({
  facility,
  home,
  current,
  onChange,
}: FacilityOrderProps) => {
  const blocked = unavailableBecause(facility);
  const option = facility.orderOptions.find(
    ({ key }) => key === current?.order.optionKey,
  );
  // Whoever took it gives the order by default, if they are home.
  const defaultGiver =
    home.find(({ id }) => id === facility.holderId)?.id ?? home[0]?.id ?? '';
  const giver = current?.characterId ?? defaultGiver;

  return (
    <Facility>
      <Row>
        <FacilityName>
          {facility.name}{' '}
          <Muted as="span">· {bastionOrderLabels[facility.order]}</Muted>
        </FacilityName>
        {blocked ? (
          <Muted as="span">{blocked}</Muted>
        ) : (
          <Select
            aria-label={`Order for the ${facility.name}`}
            value={current?.order.optionKey ?? ''}
            onChange={event => {
              const picked = facility.orderOptions.find(
                ({ key }) => key === event.target.value,
              );
              onChange(
                picked
                  ? {
                      characterId: giver,
                      order: {
                        facilityId: facility.id,
                        optionKey: picked.key,
                        costGp: picked.costGp ?? 0,
                        note: '',
                      },
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
      {current && option ? (
        <Detail>
          <Muted>
            {option.summary}{' '}
            {option.durationDays
              ? `Takes ${option.durationDays} days.`
              : 'Time per the crafting rules — 7 days unless you change it later.'}
          </Muted>
          <Row>
            {home.length > 1 ? (
              <label>
                Given by
                <Select
                  aria-label={`Who gives the ${facility.name} its order`}
                  value={current.characterId}
                  onChange={event =>
                    onChange({ ...current, characterId: event.target.value })
                  }
                >
                  {home.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </label>
            ) : null}
            <label>
              Cost (gp)
              <Small
                aria-label={`Cost of the ${facility.name} order`}
                type="number"
                min={0}
                value={current.order.costGp}
                onChange={event =>
                  onChange({
                    ...current,
                    order: {
                      ...current.order,
                      costGp: Math.max(0, Number(event.target.value) || 0),
                    },
                  })
                }
              />
            </label>
            <TextInput
              aria-label={`Details for the ${facility.name} order`}
              placeholder="Details — which item, which topic…"
              value={current.order.note}
              onChange={event =>
                onChange({
                  ...current,
                  order: { ...current.order, note: event.target.value },
                })
              }
            />
          </Row>
          {current.order.costGp ? (
            <Muted>
              Paid from the treasury: {formatGold(current.order.costGp)}.
            </Muted>
          ) : null}
        </Detail>
      ) : null}
    </Facility>
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
