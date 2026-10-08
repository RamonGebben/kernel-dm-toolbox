'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { SectionHeading } from '~/atoms/SectionHeading';
import { TextInput } from '~/atoms/TextInput';
import { wallSquare } from '~/content/bastion/basicFacilities';
import { formatGold } from '~/utils/applyGoldChange';

export type DefensesSectionProps = {
  defenderCount: number;
  defenderCapacity: number;
  wallSquares: number;
  isFullyEnclosed: boolean;
  treasuryGold: number;
  onSetDefenders: (count: number) => void;
  onBuildWalls: (squares: number) => void;
};

/**
 * Bastion Defenders and walls. Defenders change by hand here for now; the
 * bastion turn (recruiting, attacks) will move them itself.
 */
export const DefensesSection = ({
  defenderCount,
  defenderCapacity,
  wallSquares,
  isFullyEnclosed,
  treasuryGold,
  onSetDefenders,
  onBuildWalls,
}: DefensesSectionProps) => {
  const [squares, setSquares] = useState('');
  const parsed = Number(squares);
  const isWhole = Number.isInteger(parsed) && parsed >= 1;
  const cost = isWhole ? parsed * wallSquare.costGp : 0;

  return (
    <Section aria-label="Defenses">
      <SectionHeading>Defenses</SectionHeading>

      <Line>
        <Label>Bastion Defenders</Label>
        <Button
          variant="secondary"
          size="sm"
          aria-label="One fewer defender"
          disabled={defenderCount === 0}
          onClick={() => onSetDefenders(defenderCount - 1)}
        >
          −
        </Button>
        <Count aria-label="Defenders">{defenderCount}</Count>
        <Button
          variant="secondary"
          size="sm"
          aria-label="One more defender"
          onClick={() => onSetDefenders(defenderCount + 1)}
        >
          +
        </Button>
        <Muted>
          {defenderCapacity
            ? `barracks house ${defenderCapacity}`
            : 'no Barrack to house them'}
          {defenderCount > defenderCapacity && defenderCapacity
            ? ', more than the barracks hold'
            : ''}
        </Muted>
      </Line>

      <Line>
        <Label>Walls</Label>
        <span>
          {wallSquares} square{wallSquares === 1 ? '' : 's'}
          {isFullyEnclosed ? ' · fully enclosed' : ''}
        </span>
      </Line>

      <Line>
        <label htmlFor="wall-squares">
          <Label as="span">Build wall</Label>
        </label>
        <WallInput
          id="wall-squares"
          type="number"
          min={1}
          step={1}
          placeholder="squares"
          value={squares}
          onChange={event => setSquares(event.target.value)}
        />
        <Button
          size="sm"
          disabled={!isWhole || cost > treasuryGold}
          onClick={() => {
            onBuildWalls(parsed);
            setSquares('');
          }}
        >
          {isWhole
            ? `Build (${formatGold(cost)}, ${parsed * wallSquare.days} days)`
            : 'Build'}
        </Button>
      </Line>
    </Section>
  );
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Line = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Label = styled.span`
  min-width: 9rem;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Count = styled.span`
  min-width: 2ch;
  text-align: center;
  font-family: ${props => props.theme.font.mono};
`;

const Muted = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const WallInput = styled(TextInput)`
  width: 7rem;
`;
