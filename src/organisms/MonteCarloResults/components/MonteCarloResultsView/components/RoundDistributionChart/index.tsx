'use client';

import styled from 'styled-components';
import type { RoundDistributionBucket } from '~/server/simulator/engine/aggregateBatchResults';

export type RoundDistributionChartProps = {
  buckets: readonly RoundDistributionBucket[];
};

/**
 * A readable bar-per-round-count histogram — no charting dependency, this
 * app has none yet and the issue's own UI section doesn't call for one, just
 * a way to see the round-length spread at a glance.
 */
export const RoundDistributionChart = ({
  buckets,
}: RoundDistributionChartProps) => {
  const maxTrials = Math.max(1, ...buckets.map(bucket => bucket.trials));

  return (
    <List role="group" aria-label="Round-length distribution">
      {buckets.map(bucket => (
        <Row key={bucket.rounds}>
          <RoundLabel>{bucket.rounds}</RoundLabel>
          <BarTrack>
            <Bar style={{ width: `${(bucket.trials / maxTrials) * 100}%` }} />
          </BarTrack>
          <TrialLabel>{bucket.trials}</TrialLabel>
        </Row>
      ))}
    </List>
  );
};

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 2rem 1fr 2.5rem;
  align-items: center;
  gap: ${props => props.theme.space.xs};
`;

const RoundLabel = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
  text-align: right;
`;

const BarTrack = styled.div`
  height: 0.75rem;
  background: ${props => props.theme.color.canvas};
  border-radius: ${props => props.theme.radius.sm};
  overflow: hidden;
`;

const Bar = styled.div`
  height: 100%;
  background: ${props => props.theme.color.accent};
`;

const TrialLabel = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;
