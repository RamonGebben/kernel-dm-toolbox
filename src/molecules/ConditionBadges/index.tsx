'use client';

import { List } from '~/molecules/ConditionBadges/components/List';
import { Badge } from '~/molecules/ConditionBadges/components/Badge';
import { Rounds } from '~/molecules/ConditionBadges/components/Rounds';
import { Remove } from '~/molecules/ConditionBadges/components/Remove';

export interface AppliedConditionSummary {
  id: string;
  name: string;
  roundsRemaining: number | null;
  note: string | null;
}

export interface ConditionBadgesProps {
  conditions: ReadonlyArray<AppliedConditionSummary>;
  /** Omitted in read-only contexts such as the initiative row. */
  onRemove?: (id: string) => void;
}

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
