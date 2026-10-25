'use client';

import { formatGold } from '~/utils/applyGoldChange';
import { Wrapper } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep/components/Wrapper';
import { Heading } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep/components/Heading';
import { List } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep/components/List';
import { Totals } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep/components/Totals';
import { Problems } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep/components/Problems';
import { MutedParagraph } from '~/atoms/MutedParagraph';

export type TurnPreview =
  | {
      ok: true;
      lines: Array<string>;
      treasuryDelta: number;
      storedItems: Array<string>;
    }
  | { ok: false; problems: Array<string> };

export interface ReviewStepProps {
  preview: TurnPreview | null;
  isPreviewing: boolean;
  treasuryGold: number;
}

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
    return <MutedParagraph role="status">Working out the turn…</MutedParagraph>;

  if (!preview.ok) {
    return (
      <Problems role="alert" aria-label="What needs fixing">
        <Heading>This turn cannot be committed yet</Heading>
        <ul>
          {preview.problems.map(problem => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
        <MutedParagraph>
          Go back to the step that needs it, then return here.
        </MutedParagraph>
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
        <MutedParagraph>
          A quiet week: nothing ordered, nothing happened.
        </MutedParagraph>
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
