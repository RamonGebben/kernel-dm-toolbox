'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { StatusShell } from '~/organisms/ConnectionStatus/components/StatusShell';
import type { ConnectionStatus } from '~/organisms/ConnectionStatus/hooks/useConnectionStatus';

type ConnectionStatusViewProps = {
  status: ConnectionStatus;
  onRetry: () => void;
};

/**
 * Purely presentational: props in, JSX out. Every state is reachable from
 * Storybook because nothing here fetches.
 *
 * Note the shape of the branching — guard-clause early returns in a fixed
 * order (pending, then not-yet-usable, then loaded), never a ternary chain.
 */
export const ConnectionStatusView = ({
  status,
  onRetry,
}: ConnectionStatusViewProps) => {
  if (status.state === 'pending') {
    return (
      <StatusShell tone="neutral" title="Toolbox">
        <SkeletonLine />
        <SkeletonLine $isShort />
      </StatusShell>
    );
  }

  if (status.state === 'error') {
    return (
      <StatusShell tone="bad" title="Toolbox">
        <Message>Cannot reach this instance.</Message>
        <Detail>{status.reason}</Detail>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </StatusShell>
    );
  }

  return (
    <StatusShell tone="good" title="Toolbox">
      <Message>{status.campaignName}</Message>
      <Detail>
        Answered &ldquo;{status.message}&rdquo; at{' '}
        <time dateTime={status.checkedAt.toISOString()}>
          {status.checkedAt.toISOString().slice(11, 19)} UTC
        </time>
      </Detail>
    </StatusShell>
  );
};

const Message = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const Detail = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
  font-family: ${props => props.theme.font.mono};
`;

const SkeletonLine = styled.div<{ $isShort?: boolean }>`
  height: 1rem;
  width: ${props => (props.$isShort ? '40%' : '70%')};
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
