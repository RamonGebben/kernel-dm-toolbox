'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { Select } from '~/atoms/FormControls';
import { TextInput } from '~/atoms/TextInput';
import { DieInput } from '~/molecules/DieInput';
import { guestKinds } from '~/content/bastion/events';
import type { TurnContextBastion } from '~/server/trpc/helpers/bastionTurnPlan';
import type { TurnEvent } from '~/server/trpc/schemas/bastionTurns';
import { formatGold } from '~/utils/applyGoldChange';
import {
  attackDice,
  countDefenders,
  guestForRoll,
  treasureForRoll,
} from '~/utils/bastionTurn';
import { rollDie } from '~/utils/rollDice';

export type EventChange = Partial<
  Pick<TurnEvent, 'inputs' | 'outOfActionFacilityId' | 'storageItem' | 'note'>
>;

export type EventResolverProps = {
  event: TurnEvent;
  /** Who is rolling — "Ask Wren's player". */
  playerName: string;
  bastion: TurnContextBastion;
  onChange: (change: EventChange) => void;
  /** Extraordinary Opportunity: pay and roll again. */
  onRollAgain: () => void;
  /** Whether a follow-up event already exists for this one. */
  hasFollowUp: boolean;
};

/**
 * One Bastion Event's own steps, asking for exactly the dice and choices
 * that event needs. What they add up to is worked out by
 * `resolveEventOutcome` and shown as it changes.
 */
export const EventResolver = (props: EventResolverProps) => {
  const { event } = props;
  const outcome = <Outcome event={event} />;

  if (event.key === 'attack')
    return <AttackSteps {...props}>{outcome}</AttackSteps>;
  if (event.key === 'criminal-hireling')
    return <CriminalHirelingSteps {...props}>{outcome}</CriminalHirelingSteps>;
  if (event.key === 'extraordinary-opportunity')
    return <OpportunitySteps {...props}>{outcome}</OpportunitySteps>;
  if (event.key === 'friendly-visitors' || event.key === 'refugees')
    return <PaymentSteps {...props}>{outcome}</PaymentSteps>;
  if (event.key === 'guest')
    return <GuestSteps {...props}>{outcome}</GuestSteps>;
  if (event.key === 'lost-hirelings')
    return <LostHirelingsSteps {...props}>{outcome}</LostHirelingsSteps>;
  if (event.key === 'magical-discovery')
    return <DiscoverySteps {...props}>{outcome}</DiscoverySteps>;
  if (event.key === 'request-for-aid')
    return <RequestForAidSteps {...props}>{outcome}</RequestForAidSteps>;
  if (event.key === 'treasure')
    return <TreasureSteps {...props}>{outcome}</TreasureSteps>;

  return <QuietWeekSteps {...props}>{outcome}</QuietWeekSteps>;
};

type StepsProps = EventResolverProps & { children: React.ReactNode };

const setInput = (
  { event, onChange }: EventResolverProps,
  key: string,
  value: number,
) => onChange({ inputs: { ...event.inputs, [key]: value } });

/** The plain result: gold in and out, defenders, what was stored. */
const Outcome = ({ event }: { event: TurnEvent }) => {
  const parts = [
    event.goldGained ? `+${formatGold(event.goldGained)}` : null,
    event.goldPaid ? `−${formatGold(event.goldPaid)}` : null,
    event.defendersGained ? `+${countDefenders(event.defendersGained)}` : null,
    event.defendersLost ? `−${countDefenders(event.defendersLost)}` : null,
    event.storageItem ? `to storage: ${event.storageItem}` : null,
  ].filter(Boolean);

  return parts.length ? <Result>Outcome: {parts.join(' · ')}</Result> : null;
};

const FacilityPicker = ({
  label,
  bastion,
  value,
  onPick,
}: {
  label: string;
  bastion: TurnContextBastion;
  value: string | null;
  onPick: (facilityId: string | null) => void;
}) => (
  <Row>
    <Select
      aria-label={label}
      value={value ?? ''}
      onChange={change => onPick(change.target.value || null)}
    >
      <option value="">Choose a facility</option>
      {bastion.facilities.map(facility => (
        <option key={facility.id} value={facility.id}>
          {facility.name}
        </option>
      ))}
    </Select>
    <Button
      variant="ghost"
      size="sm"
      disabled={!bastion.facilities.length}
      onClick={() =>
        onPick(
          bastion.facilities[rollDie(bastion.facilities.length) - 1]?.id ??
            null,
        )
      }
    >
      Pick at random
    </Button>
  </Row>
);

const AttackSteps = ({ children, ...props }: StepsProps) => {
  const { event, bastion, onChange } = props;
  const dice = attackDice(bastion);
  const [rolled, setRolled] = useState<number[] | null>(null);

  return (
    <Steps>
      {bastion.hasGuestMonster ? (
        <Note>
          A friendly monster is staying: no defenders are lost this time.
        </Note>
      ) : null}
      <Text>
        Roll{' '}
        <Dice>
          {dice.count}d{dice.sides}
        </Dice>{' '}
        for losses
        {bastion.isFullyEnclosed ? ' (two fewer behind full walls)' : ''}
        {bastion.isArmoryStocked ? ' (d8s: the Armory is stocked)' : ''}. Each 1
        kills a defender; there are {bastion.defenderCount}.
      </Text>
      <Row>
        <label>
          Dice showing 1
          <Small
            aria-label="Dice showing 1"
            type="number"
            min={0}
            max={dice.count}
            value={event.inputs.ones ?? 0}
            onChange={change =>
              setInput(props, 'ones', Number(change.target.value) || 0)
            }
          />
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const rolls = Array.from({ length: dice.count }, () =>
              rollDie(dice.sides),
            );
            setRolled(rolls);
            setInput(props, 'ones', rolls.filter(value => value === 1).length);
          }}
        >
          Roll for me
        </Button>
        {rolled ? <Dice>{rolled.join(', ')}</Dice> : null}
      </Row>
      {bastion.defenderCount === 0 ? (
        <>
          <Text>
            With no defenders, the raiders shut a special facility down for the
            next turn.
          </Text>
          <FacilityPicker
            label="Facility the attack shuts down"
            bastion={bastion}
            value={event.outOfActionFacilityId}
            onPick={facilityId =>
              onChange({ outOfActionFacilityId: facilityId })
            }
          />
        </>
      ) : null}
      {children}
    </Steps>
  );
};

const CriminalHirelingSteps = ({ children, ...props }: StepsProps) => {
  const { event, bastion, playerName, onChange } = props;
  const paid = event.inputs.pay === 1;

  return (
    <Steps>
      <FacilityPicker
        label="Whose hireling was caught"
        bastion={bastion}
        value={event.outOfActionFacilityId}
        onPick={facilityId => onChange({ outOfActionFacilityId: facilityId })}
      />
      <DieInput
        label={`Ask ${playerName}'s player to roll the bribe (× 100 GP)`}
        sides={6}
        value={event.inputs.bribeRoll ?? 0}
        onChange={value => setInput(props, 'bribeRoll', value)}
      />
      <Row>
        <label>
          <input
            type="radio"
            name={`bribe-${event.characterId}`}
            checked={paid}
            onChange={() => setInput(props, 'pay', 1)}
          />
          Pay the bribe
        </label>
        <label>
          <input
            type="radio"
            name={`bribe-${event.characterId}`}
            checked={!paid}
            onChange={() => setInput(props, 'pay', 0)}
          />
          Refuse: the facility is out of action next turn
        </label>
      </Row>
      {children}
    </Steps>
  );
};

const OpportunitySteps = ({ children, ...props }: StepsProps) => {
  const { event, onRollAgain, hasFollowUp } = props;
  const accepted = event.inputs.accept === 1;

  return (
    <Steps>
      <Row>
        <label>
          <input
            type="radio"
            name={`opportunity-${event.characterId}-${event.roll}`}
            checked={accepted}
            onChange={() => setInput(props, 'accept', 1)}
          />
          Take it: pay 500 GP and roll again
        </label>
        <label>
          <input
            type="radio"
            name={`opportunity-${event.characterId}-${event.roll}`}
            checked={!accepted}
            onChange={() => setInput(props, 'accept', 0)}
          />
          Let it pass
        </label>
      </Row>
      {accepted && !hasFollowUp ? (
        <Button size="sm" onClick={onRollAgain}>
          Roll the follow-up event
        </Button>
      ) : null}
      {children}
    </Steps>
  );
};

const PaymentSteps = ({ children, ...props }: StepsProps) => {
  const { event, playerName } = props;
  const isRefugees = event.key === 'refugees';

  return (
    <Steps>
      {isRefugees ? (
        <DieInput
          label="How many refugees"
          count={2}
          sides={4}
          value={event.inputs.refugeeCount ?? 0}
          onChange={value => setInput(props, 'refugeeCount', value)}
        />
      ) : null}
      <DieInput
        label={`Ask ${playerName}'s player to roll what they pay (× 100 GP)`}
        sides={6}
        value={event.inputs[isRefugees ? 'payRoll' : 'roll'] ?? 0}
        onChange={value =>
          setInput(props, isRefugees ? 'payRoll' : 'roll', value)
        }
      />
      {children}
    </Steps>
  );
};

const GuestSteps = ({ children, ...props }: StepsProps) => {
  const { event, playerName } = props;
  const kindRoll = event.inputs.kindRoll ?? 0;
  const kind = kindRoll >= 1 && kindRoll <= 4 ? guestForRoll(kindRoll) : null;

  return (
    <Steps>
      <DieInput
        label={`Ask ${playerName}'s player who it is`}
        sides={4}
        value={kindRoll}
        onChange={value => setInput(props, 'kindRoll', value)}
      />
      {kind ? (
        <Text>{kind.label}.</Text>
      ) : (
        <Muted>
          {guestKinds.map(({ roll, key }) => `${roll}: ${key}`).join(' · ')}
        </Muted>
      )}
      {kind?.key === 'sanctuary' ? (
        <DieInput
          label="Their gift (× 100 GP)"
          sides={6}
          value={event.inputs.giftRoll ?? 0}
          onChange={value => setInput(props, 'giftRoll', value)}
        />
      ) : null}
      {children}
    </Steps>
  );
};

const LostHirelingsSteps = ({ children, ...props }: StepsProps) => (
  <Steps>
    <FacilityPicker
      label="Facility whose hirelings went missing"
      bastion={props.bastion}
      value={props.event.outOfActionFacilityId}
      onPick={facilityId =>
        props.onChange({ outOfActionFacilityId: facilityId })
      }
    />
    {children}
  </Steps>
);

const DiscoverySteps = ({ children, ...props }: StepsProps) => (
  <Steps>
    <TextInput
      aria-label="Which potion or scroll"
      placeholder={`${props.playerName} picks an Uncommon potion or scroll`}
      value={props.event.storageItem}
      onChange={change => props.onChange({ storageItem: change.target.value })}
    />
    {children}
  </Steps>
);

const RequestForAidSteps = ({ children, ...props }: StepsProps) => {
  const { event, bastion, playerName } = props;
  const helping = event.inputs.help === 1;
  const sent = Math.min(event.inputs.sent ?? 0, bastion.defenderCount);

  return (
    <Steps>
      <Row>
        <label>
          <input
            type="radio"
            name={`aid-${event.characterId}-${event.roll}`}
            checked={helping}
            onChange={() => setInput(props, 'help', 1)}
          />
          Send defenders
        </label>
        <label>
          <input
            type="radio"
            name={`aid-${event.characterId}-${event.roll}`}
            checked={!helping}
            onChange={() => setInput(props, 'help', 0)}
          />
          Decline
        </label>
      </Row>
      {helping ? (
        <>
          <Row>
            <label>
              Defenders sent
              <Small
                aria-label="Defenders sent"
                type="number"
                min={1}
                max={bastion.defenderCount}
                value={sent || ''}
                onChange={change =>
                  setInput(props, 'sent', Number(change.target.value) || 0)
                }
              />
            </label>
          </Row>
          {sent ? (
            <DieInput
              label="Their rolls, added up (10 or more succeeds)"
              count={sent}
              sides={6}
              value={event.inputs.total ?? 0}
              onChange={value => setInput(props, 'total', value)}
            />
          ) : null}
          <DieInput
            label={`Ask ${playerName}'s player to roll the reward (× 100 GP)`}
            sides={6}
            value={event.inputs.rewardRoll ?? 0}
            onChange={value => setInput(props, 'rewardRoll', value)}
          />
        </>
      ) : null}
      {children}
    </Steps>
  );
};

const TreasureSteps = ({ children, ...props }: StepsProps) => {
  const { event, playerName, onChange } = props;
  const tableRoll = event.inputs.tableRoll ?? 0;

  return (
    <Steps>
      <DieInput
        label={`Ask ${playerName}'s player to roll on the treasure table`}
        sides={100}
        value={tableRoll}
        onChange={value =>
          onChange({
            inputs: { ...event.inputs, tableRoll: value },
            storageItem: value ? treasureForRoll(value) : '',
          })
        }
      />
      {tableRoll ? (
        <TextInput
          aria-label="The treasure, as stored"
          value={event.storageItem}
          onChange={change => onChange({ storageItem: change.target.value })}
        />
      ) : null}
      {children}
    </Steps>
  );
};

const QuietWeekSteps = ({ children, ...props }: StepsProps) => (
  <Steps>
    <TextInput
      aria-label="Anything worth noting"
      placeholder="Anything worth noting (optional)"
      value={props.event.note}
      onChange={change => props.onChange({ note: change.target.value })}
    />
    {children}
  </Steps>
);

const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};

  label {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.space.xs};
  }
`;

const Text = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
`;

const Note = styled(Text)`
  color: ${props => props.theme.color.success};
`;

const Muted = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Result = styled.p`
  margin: 0;
  font-weight: 600;
  color: ${props => props.theme.color.accent};
`;

const Dice = styled.span`
  font-family: ${props => props.theme.font.mono};
  color: ${props => props.theme.color.accent};
`;

const Small = styled(TextInput)`
  width: 6rem;
`;
