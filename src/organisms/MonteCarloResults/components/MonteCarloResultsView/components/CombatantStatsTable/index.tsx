'use client';

import styled from 'styled-components';
import type { CombatantBatchStats } from '~/server/simulator/engine/aggregateBatchResults';
import { formatPercent } from '~/utils/formatPercent';

export type CombatantStatsTableProps = {
  combatants: readonly CombatantBatchStats[];
};

/** One row per `templateKey` — a stacked monster entry (e.g. four goblins)
 * is already one row by the time it reaches here, per-instance averages
 * computed in `aggregateBatchResults`. */
export const CombatantStatsTable = ({
  combatants,
}: CombatantStatsTableProps) => (
  <Table>
    <thead>
      <tr>
        <Th scope="col">Combatant</Th>
        <Th scope="col">Side</Th>
        <Th scope="col">Survival</Th>
        <Th scope="col">Went down</Th>
        <Th scope="col">Avg. dealt</Th>
        <Th scope="col">Avg. taken</Th>
        <Th scope="col">Kill rate</Th>
      </tr>
    </thead>
    <tbody>
      {combatants.map(combatant => (
        <tr key={combatant.templateKey}>
          <Td>{combatant.name}</Td>
          <Td>{combatant.side === 'party' ? 'Party' : 'Monster'}</Td>
          <Td>{formatPercent(combatant.survivalRate)}</Td>
          {/* Monsters never track death saves, so `wentDownRate` is always
           * 0 for them — a dash reads more honestly than a permanent "0%"
           * that looks like a (misleading) stat. */}
          <Td>
            {combatant.side === 'party'
              ? formatPercent(combatant.wentDownRate)
              : '—'}
          </Td>
          <Td>{combatant.averageDamageDealt.toFixed(1)}</Td>
          <Td>{combatant.averageDamageTaken.toFixed(1)}</Td>
          <Td>{combatant.killRate.toFixed(2)}</Td>
        </tr>
      ))}
    </tbody>
  </Table>
);

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${props => props.theme.fontSize.sm};
`;

const Th = styled.th`
  text-align: left;
  padding: ${props => props.theme.space.xs};
  color: ${props => props.theme.color.textMuted};
  border-bottom: 1px solid ${props => props.theme.color.border};
  font-weight: 600;
`;

const Td = styled.td`
  padding: ${props => props.theme.space.xs};
  color: ${props => props.theme.color.textPrimary};
  border-bottom: 1px solid ${props => props.theme.color.border};
`;
