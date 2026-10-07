'use client';

import styled from 'styled-components';
import { DieInput } from '~/molecules/DieInput';
import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import type { TurnDraft, TurnEvent } from '~/server/trpc/schemas/bastionTurns';
import { eventForRoll } from '~/utils/bastionTurn';
import {
  blankEvent,
  isRolled,
  replaceEvent,
  updateEvent,
} from '~/organisms/BastionTurn/hooks/useBastionTurn';
import {
  EventResolver,
  type EventChange,
} from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventResolver';

export type EventsStepProps = {
  context: TurnContext;
  draft: TurnDraft;
  onChange: (draft: TurnDraft) => void;
};

/**
 * Step 4: one Bastion Event for everyone who maintained. Each asks for the
 * d100, names the event, then walks through that event's own dice.
 */
export const EventsStep = ({ context, draft, onChange }: EventsStepProps) => {
  if (!draft.events.length) {
    return (
      <Muted>
        Everyone gave orders this turn, so there are no Bastion Events to roll.
      </Muted>
    );
  }

  const replace = (index: number, next: TurnEvent) =>
    onChange({ ...draft, events: replaceEvent(draft.events, index, next) });

  const rollAgain = (index: number) => {
    const source = draft.events[index]!;
    onChange({
      ...draft,
      events: [
        ...draft.events.slice(0, index + 1),
        blankEvent(source.bastionId, source.characterId),
        ...draft.events.slice(index + 1),
      ],
    });
  };

  return (
    <Wrapper>
      {draft.events.map((event, index) => {
        const bastion = context.bastions.find(
          ({ id }) => id === event.bastionId,
        );
        if (!bastion) return null;
        const name =
          bastion.actors.find(({ id }) => id === event.characterId)?.name ??
          'Someone';
        const definition = isRolled(event) ? eventForRoll(event.roll) : null;
        const next = draft.events[index + 1];
        const hasFollowUp =
          next?.bastionId === event.bastionId &&
          next.characterId === event.characterId;
        const change = (patch: EventChange & { roll?: number }) =>
          replace(index, updateEvent(event, patch, bastion));

        return (
          <Event
            key={`${event.characterId}-${index}`}
            aria-label={`${name}'s Bastion Event`}
          >
            <Heading>
              {name} · {bastion.name}
            </Heading>
            <DieInput
              label={`Ask ${name}'s player to roll for the Bastion Event`}
              sides={100}
              value={event.roll}
              onChange={roll => change({ roll })}
            />
            {definition ? (
              <>
                <EventName>{definition.name}</EventName>
                <Muted>{definition.summary}</Muted>
                <EventResolver
                  event={event}
                  playerName={name}
                  bastion={bastion}
                  onChange={change}
                  onRollAgain={() => rollAgain(index)}
                  hasFollowUp={hasFollowUp}
                />
              </>
            ) : null}
          </Event>
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

const Event = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.md};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Heading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const EventName = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.accent};
`;

const Muted = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
