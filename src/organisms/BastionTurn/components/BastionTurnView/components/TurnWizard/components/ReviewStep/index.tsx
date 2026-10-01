'use client';

import styled from 'styled-components';
import { formatGold } from '~/utils/applyGoldChange';

export type TurnPreview =
  | {
      ok: true;
      lines: string[];
      treasuryDelta: number;
      storedItems: string[];
    }
  | { ok: false; problems: string[] };

export type ReviewStepProps = {
  preview: TurnPreview | null;
  isPreviewing: boolean;
  treasuryGold: number;
};

/**
 * Step 5: everything the turn will do, worked out by the server exactly as
 * the commit will — or what is stopping it, with the step to fix it in.
 */
export const ReviewStep = ({
  preview,
  isPreviewing,
  treasuryGold,
}: ReviewStepProps) => {
  if (isPreviewing || !preview)
    return <Muted role="status">Working out the turn…</Muted>;

  if (!preview.ok) {
    return (
      <Problems role="alert" aria-label="What needs fixing">
        <Heading>This turn cannot be committed yet</Heading>
        <ul>
          {preview.problems.map(problem => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
        <Muted>Go back to the step that needs it, then return here.</Muted>
      </Problems>
    );
  }

  const after = treasuryGold + preview.treasuryDelta;

  return (
    <Wrapper>
      <Heading>This turn</Heading>
      {preview.lines.length ? (
        <List aria-label="What happens">
          {preview.lines.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </List>
      ) : (
        <Muted>A quiet week: nothing ordered, nothing happened.</Muted>
      )}
      <Totals>
        <span>
          Treasury: {formatGold(treasuryGold)} → {formatGold(after)} (
          {preview.treasuryDelta >= 0 ? '+' : '−'}
          {formatGold(Math.abs(preview.treasuryDelta))})
        </span>
        {preview.storedItems.length ? (
          <span>To storage: {preview.storedItems.join(', ')}</span>
        ) : null}
      </Totals>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Heading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
`;

const List = styled.ul`
  margin: 0;
  padding-left: ${props => props.theme.space.md};
`;

const Totals = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  font-family: ${props => props.theme.font.mono};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Problems = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.md};
  border: 1px solid ${props => props.theme.color.danger};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};

  ul {
    margin: 0;
    padding-left: ${props => props.theme.space.md};
  }
`;

const Muted = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textMuted};
`;
