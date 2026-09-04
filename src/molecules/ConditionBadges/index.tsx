'use client';

import styled from 'styled-components';

export type AppliedConditionSummary = {
  id: string;
  name: string;
  roundsRemaining: number | null;
  note: string | null;
};

export type ConditionBadgesProps = {
  conditions: readonly AppliedConditionSummary[];
  /** Omitted in read-only contexts such as the initiative row. */
  onRemove?: (id: string) => void;
};

/**
 * The conditions currently on a combatant, with their countdown.
 *
 * A duration reads as "Poisoned 3" — the number of rounds left, which is what
 * gets said out loud at the table. Indefinite conditions show no number.
 */
export const ConditionBadges = ({
  conditions,
  onRemove,
}: ConditionBadgesProps) => {
  if (!conditions.length) return null;

  return (
    <List>
      {conditions.map(condition => (
        <li key={condition.id}>
          <Badge title={condition.note ?? undefined}>
            {condition.name}
            {condition.roundsRemaining !== null && (
              <Rounds>{condition.roundsRemaining}</Rounds>
            )}
            {onRemove && (
              <Remove
                type="button"
                onClick={() => onRemove(condition.id)}
                aria-label={`Remove ${condition.name}`}
              >
                ✕
              </Remove>
            )}
          </Badge>
        </li>
      ))}
    </List>
  );
};

const List = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  padding: 0 ${props => props.theme.space.xs};
  background: ${props => props.theme.color.accentMuted};
  border-radius: ${props => props.theme.radius.pill};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Rounds = styled.span`
  font-family: ${props => props.theme.font.mono};
  color: ${props => props.theme.color.warning};
`;

const Remove = styled.button`
  padding: 0;
  background: none;
  border: none;
  color: ${props => props.theme.color.textMuted};
  font: inherit;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color.textPrimary};
  }
`;
