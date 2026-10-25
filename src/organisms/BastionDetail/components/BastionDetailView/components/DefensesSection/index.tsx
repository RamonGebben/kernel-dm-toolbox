'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { SectionHeading } from '~/atoms/SectionHeading';
import { wallSquare } from '~/content/bastion/basicFacilities';
import { formatGold } from '~/utils/applyGoldChange';
import { Stack } from '~/atoms/Stack';
import { Line } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection/components/Line';
import { Label } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection/components/Label';
import { Count } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection/components/Count';
import { MutedCaption } from '~/atoms/MutedCaption';
import { WallInput } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection/components/WallInput';

export interface DefensesSectionProps {
  defenderCount: number;
  defenderCapacity: number;
  wallSquares: number;
  isFullyEnclosed: boolean;
  treasuryGold: number;
  onSetDefenders: (count: number) => void;
  onBuildWalls: (squares: number) => void;
}

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
    <Stack as="section" $gap="s" aria-label="Defenses">
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
        <MutedCaption>
          {defenderCapacity
            ? `barracks house ${defenderCapacity}`
            : 'no Barrack to house them'}
          {defenderCount > defenderCapacity && defenderCapacity
            ? ', more than the barracks hold'
            : ''}
        </MutedCaption>
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
    </Stack>
  );
};
