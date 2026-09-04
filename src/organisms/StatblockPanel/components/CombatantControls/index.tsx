'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { HitPointControls } from '~/molecules/HitPointControls';

export type CombatantControlsProps = {
  displayName: string;
  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  isHidden: boolean;
  isPending: boolean;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onGrantTemporary: (amount: number) => void;
  onToggleHidden: () => void;
};

/**
 * What the DM does *to* the selected combatant, above the reference material
 * about it. Hit points first, because that is the thing being changed every
 * round; hiding is a per-fight decision made once.
 */
export const CombatantControls = ({
  displayName,
  currentHitPoints,
  maxHitPoints,
  temporaryHitPoints,
  isHidden,
  isPending,
  onDamage,
  onHeal,
  onGrantTemporary,
  onToggleHidden,
}: CombatantControlsProps) => (
  <Wrapper>
    <Header>
      <Name>{displayName}</Name>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleHidden}
        aria-pressed={isHidden}
      >
        {isHidden ? 'Reveal to players' : 'Hide from players'}
      </Button>
    </Header>

    <HitPointControls
      currentHitPoints={currentHitPoints}
      maxHitPoints={maxHitPoints}
      temporaryHitPoints={temporaryHitPoints}
      isPending={isPending}
      onDamage={onDamage}
      onHeal={onHeal}
      onGrantTemporary={onGrantTemporary}
    />
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  margin-bottom: ${props => props.theme.space.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const Name = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;
