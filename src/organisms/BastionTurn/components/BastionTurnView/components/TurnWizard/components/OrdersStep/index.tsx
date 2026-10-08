'use client';

import { Select } from '~/atoms/Select';
import { TextInput } from '~/atoms/TextInput';
import { bastionOrderLabels } from '~/content/bastion/orders';
import type { FacilityOrderEffect } from '~/content/bastion/types';
import type {
  TurnContext,
  TurnContextBastion,
  TurnContextFacility,
} from '~/server/trpc/helpers/bastionTurnPlan';
import type {
  TurnDraft,
  TurnFacilityOrder,
} from '~/server/trpc/schemas/bastionTurns';
import { formatGold } from '~/utils/applyGoldChange';
import {
  isMaintaining,
  MAX_RECRUITS,
  storehouseBuyLimit,
  storehouseSalePrice,
  storehouseSellMargin,
  suggestedRecruits,
  TURN_DAYS,
} from '~/utils/bastionTurn';
import {
  findFacilityOrder,
  setFacilityOrder,
} from '~/organisms/BastionTurn/hooks/useBastionTurn';
import { Stack } from '~/atoms/Stack';
import { Heading } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Heading';
import { StepCard } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/StepCard';
import { Row } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/OrdersStep/components/Row';
import { FacilityName } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/OrdersStep/components/FacilityName';
import { MutedNote } from '~/atoms/MutedNote';
import { Small } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Small';

export interface OrdersStepProps {
  context: TurnContext;
  draft: TurnDraft;
  onChange: (draft: TurnDraft) => void;
}

/** Why a facility cannot take an order this turn, or null when it can. */
const unavailableBecause = (facility: TurnContextFacility): string | null => {
  if (facility.isOutOfAction) return 'Out of action this turn';
  if (facility.isBusy)
    return `Busy: ${facility.jobLabel ?? 'a job'}, ${facility.jobDaysRemaining - TURN_DAYS} days left after this week`;
  return null;
};

/** Someone home to give orders, and how many of theirs are spoken for. */
interface Giver {
  id: string;
  name: string;
  level: number;
  given: number;
  limit: number;
}

/**
 * Step 3: orders, facility by facility. Every facility in a bastion is there
 * for everyone (DECISIONS #34), so whoever is home can give it its one order
 * this turn. Each member has only so many orders (`orderLimit`); once theirs
 * are given they drop out of the choice of who gives the next one. A
 * facility left on "No order" idles.
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
      <MutedNote>
        Nobody is giving orders this turn, so everyone maintains. On to the
        Bastion Events.
      </MutedNote>
    );
  }

  return (
    <Stack>
      {bastions.map(bastion => {
        const home: Array<Giver> = ordering(bastion.id).map(actor => {
          const member = bastion.actors.find(
            ({ id }) => id === actor.characterId,
          );

          return {
            id: actor.characterId,
            name: member?.name ?? 'Someone',
            level: member?.level ?? 0,
            given: actor.facilityOrders.length,
            limit: member?.orderLimit ?? 0,
          };
        });

        return (
          <Stack
            as="section"
            $gap="s"
            key={bastion.id}
            aria-label={`Orders for ${bastion.name}`}
          >
            <Heading>
              {bastion.name}
              <MutedNote as="span">
                {' '}
                · orders given:{' '}
                {home
                  .map(
                    ({ name, given, limit }) => `${name} ${given} of ${limit}`,
                  )
                  .join(', ')}
              </MutedNote>
            </Heading>
            {bastion.facilities.length ? null : (
              <MutedNote>There are no special facilities here yet.</MutedNote>
            )}
            {bastion.facilities.map(facility => (
              <FacilityOrder
                key={facility.id}
                facility={facility}
                home={home}
                goods={bastion.goods}
                roster={{
                  defenders: bastion.defenderCount,
                  capacity: bastion.defenderCapacity,
                }}
                current={findFacilityOrder(draft, facility.id)}
                onChange={order =>
                  onChange(
                    setFacilityOrder(draft, bastion.id, facility.id, order),
                  )
                }
              />
            ))}
          </Stack>
        );
      })}
    </Stack>
  );
};

interface FacilityOrderProps {
  facility: TurnContextFacility;
  /** Who is home to give it an order. */
  home: ReadonlyArray<Giver>;
  /** Trade goods in storage, for a Storehouse to sell. */
  goods: TurnContextBastion['goods'];
  /** Defenders now and the bunks the barracks have, for recruiting. */
  roster: { defenders: number; capacity: number };
  current: { characterId: string; order: TurnFacilityOrder } | null;
  onChange: (
    order: { characterId: string; order: TurnFacilityOrder } | null,
  ) => void;
}

/** One facility's order: what it does, and who of those home said so. */
const FacilityOrder = ({
  facility,
  home,
  goods,
  roster,
  current,
  onChange,
}: FacilityOrderProps) => {
  const option = facility.orderOptions.find(
    ({ key }) => key === current?.order.optionKey,
  );
  // Whoever gave this order stays in the list; anyone else needs one to spare.
  const givers = home.filter(
    member => member.given < member.limit || member.id === current?.characterId,
  );
  // Whoever took it gives the order by default, if they can.
  const defaultGiver =
    givers.find(({ id }) => id === facility.holderId)?.id ?? givers[0]?.id;
  const giver = home.find(({ id }) => id === current?.characterId);
  const blocked =
    unavailableBecause(facility) ??
    (defaultGiver ? null : 'Everyone home has given all their orders');

  return (
    <StepCard>
      <Row>
        <FacilityName>
          {facility.name}{' '}
          <MutedNote as="span">
            · {bastionOrderLabels[facility.order]}
          </MutedNote>
        </FacilityName>
        {blocked || !defaultGiver ? (
          <MutedNote as="span">{blocked}</MutedNote>
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
                      characterId: current?.characterId ?? defaultGiver,
                      order: {
                        facilityId: facility.id,
                        optionKey: picked.key,
                        costGp: picked.costGp ?? 0,
                        note: '',
                        ...(picked.effect === 'sell-goods' && goods[0]
                          ? { storageItemId: goods[0].id }
                          : {}),
                        ...(picked.effect === 'recruit-defenders'
                          ? { quantity: suggestedRecruits(roster) }
                          : {}),
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
        <Stack $gap="xs">
          <MutedNote>
            {option.summary}{' '}
            {option.durationDays
              ? `Takes ${option.durationDays} days.`
              : `Its time follows the crafting rules; the turn counts ${TURN_DAYS} days.`}
          </MutedNote>
          {option.effect === 'recruit-defenders' ? (
            <MutedNote>
              {roster.defenders} of {roster.capacity} bunks in the barracks are
              taken. The recruits join when the order finishes next turn.
            </MutedNote>
          ) : null}
          <TradeHint
            effect={option.effect}
            giver={giver}
            lot={goods.find(({ id }) => id === current.order.storageItemId)}
          />
          <Row>
            {givers.length > 1 ? (
              <label>
                Given by
                <Select
                  aria-label={`Who gives the ${facility.name} its order`}
                  value={current.characterId}
                  onChange={event =>
                    onChange({ ...current, characterId: event.target.value })
                  }
                >
                  {givers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
              </label>
            ) : null}
            {option.effect === 'sell-goods' ? (
              <label>
                Goods to sell
                <Select
                  aria-label={`Goods the ${facility.name} sells`}
                  value={current.order.storageItemId ?? ''}
                  onChange={event =>
                    onChange({
                      ...current,
                      order: {
                        ...current.order,
                        storageItemId: event.target.value || undefined,
                      },
                    })
                  }
                >
                  {goods.length ? null : <option value="">None stored</option>}
                  {goods.map(lot => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name} ({formatGold(lot.valueGp)})
                    </option>
                  ))}
                </Select>
              </label>
            ) : option.effect === 'recruit-defenders' ? (
              <label>
                Defenders to recruit
                <Small
                  aria-label={`Defenders the ${facility.name} recruits`}
                  type="number"
                  min={1}
                  max={MAX_RECRUITS}
                  value={current.order.quantity ?? MAX_RECRUITS}
                  onChange={event =>
                    onChange({
                      ...current,
                      order: {
                        ...current.order,
                        quantity: Math.min(
                          MAX_RECRUITS,
                          Math.max(1, Number(event.target.value) || 1),
                        ),
                      },
                    })
                  }
                />
              </label>
            ) : (
              <label>
                {option.effect === 'buy-goods'
                  ? 'Goods bought (gp)'
                  : 'Cost (gp)'}
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
            )}
            <TextInput
              aria-label={`Details for the ${facility.name} order`}
              placeholder={
                option.effect === 'buy-goods'
                  ? 'What goods: silk, iron, spices…'
                  : 'Details: which item, which topic…'
              }
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
            <MutedNote>
              Paid from the treasury: {formatGold(current.order.costGp)}.
            </MutedNote>
          ) : null}
        </Stack>
      ) : null}
    </StepCard>
  );
};

interface TradeHintProps {
  effect: FacilityOrderEffect | null;
  giver: Giver | undefined;
  lot: TurnContextBastion['goods'][number] | undefined;
}

/** What a Storehouse order comes to for whoever gives it. */
const TradeHint = ({ effect, giver, lot }: TradeHintProps) => {
  if (!giver) return null;

  if (effect === 'buy-goods') {
    return (
      <MutedNote>
        {giver.name} is level {giver.level}: up to{' '}
        {formatGold(storehouseBuyLimit(giver.level))} of goods in one order.
        They arrive in storage, at what was paid, when the order finishes.
      </MutedNote>
    );
  }
  if (effect !== 'sell-goods') return null;
  if (!lot) {
    return (
      <MutedNote>
        There are no trade goods in storage to sell. Buy some first.
      </MutedNote>
    );
  }

  return (
    <MutedNote>
      Sells for {formatGold(storehouseSalePrice(lot.valueGp, giver.level))} (
      {storehouseSellMargin(giver.level)}% profit at level {giver.level}). The
      goods leave storage now and the gold comes in when the sale finishes.
    </MutedNote>
  );
};
