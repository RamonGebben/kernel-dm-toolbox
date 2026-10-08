'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { Modal } from '~/atoms/Modal';
import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import type { TurnDraft } from '~/server/trpc/schemas/bastionTurns';
import { formatGold } from '~/utils/applyGoldChange';
import { TurnWizard } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard';
import type { TurnPreview } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep';
import { Wrapper } from '~/organisms/BastionTurn/components/BastionTurnView/components/Wrapper';
import { Text } from '~/organisms/BastionTurn/components/BastionTurnView/components/Text';
import { Actions } from '~/organisms/BastionTurn/components/BastionTurnView/components/Actions';
import { History } from '~/organisms/BastionTurn/components/BastionTurnView/components/History';
import { Done } from '~/organisms/BastionTurn/components/BastionTurnView/components/Done';
import { DoneTitle } from '~/organisms/BastionTurn/components/BastionTurnView/components/DoneTitle';
import { Entry } from '~/organisms/BastionTurn/components/BastionTurnView/components/Entry';

export interface TurnHistoryEntry {
  id: string;
  number: number;
  committedAt: Date | null;
  lines: Array<string>;
  treasuryDelta: number;
}

export interface BastionTurnViewProps {
  isPending: boolean;
  context: TurnContext | null;
  turn: { id: string; number: number; draft: TurnDraft } | null;
  history: ReadonlyArray<TurnHistoryEntry>;
  isSaving: boolean;
  error: string | null;
  preview: TurnPreview | null;
  isPreviewing: boolean;
  onStart: () => Promise<unknown>;
  onSave: (draft: TurnDraft) => Promise<unknown>;
  onRequestPreview: (draft: TurnDraft) => void;
  onDiscard: () => void;
  onCommit: () => Promise<{ lines: Array<string> } | null>;
}

/**
 * The bastion turn's way in: start one (or resume the one under way), and
 * the log of every turn so far, newest first. Seven days pass for every bastion at once.
 */
export const BastionTurnView = ({
  isPending,
  context,
  turn,
  history,
  isSaving,
  error,
  preview,
  isPreviewing,
  onStart,
  onSave,
  onRequestPreview,
  onDiscard,
  onCommit,
}: BastionTurnViewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  // What the last commit did. Committing ends the turn in progress, so the
  // summary is kept here rather than in the wizard, which unmounts with it.
  const [finished, setFinished] = useState<{
    number: number;
    lines: Array<string>;
  } | null>(null);

  if (isPending || !context) return null;
  if (!context.bastions.length && !history.length) return null;

  const open = async () => {
    setFinished(null);
    if (!turn) await onStart();
    // The preview is worked out on the way into the review step and is not
    // saved with the draft, so a turn resumed there has to ask for it again.
    else if (turn.draft.step === 'review') onRequestPreview(turn.draft);
    setIsOpen(true);
  };

  const commit = async () => {
    const result = await onCommit();
    if (result && turn)
      setFinished({ number: turn.number, lines: result.lines });
    return result;
  };

  const close = () => {
    setIsOpen(false);
    setFinished(null);
  };

  return (
    <Wrapper aria-label="Bastion turn">
      <Text>
        {turn
          ? `Bastion turn ${turn.number} is under way.`
          : `Next up: bastion turn ${context.turnNumber}, seven days for every bastion.`}
      </Text>
      <Actions>
        <Button
          size="sm"
          disabled={isSaving || !context.bastions.length}
          onClick={() => void open()}
        >
          {turn ? `Resume turn ${turn.number}` : 'Start bastion turn'}
        </Button>
        {history.length ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
          >
            Turn log
          </Button>
        ) : null}
      </Actions>

      <Modal
        title={`Bastion turn ${finished?.number ?? turn?.number ?? context.turnNumber}`}
        isOpen={isOpen && Boolean(turn || finished)}
        onClose={close}
        size="wide"
      >
        <TurnModalBody
          finished={finished}
          turn={turn}
          context={context}
          isSaving={isSaving}
          error={error}
          preview={preview}
          isPreviewing={isPreviewing}
          onSave={onSave}
          onRequestPreview={onRequestPreview}
          onDiscard={() => {
            onDiscard();
            setIsOpen(false);
          }}
          onCommit={commit}
          onClose={close}
        />
      </Modal>

      <Modal
        title="Bastion turn log"
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        size="wide"
      >
        <History>
          {history.map(entry => (
            <li key={entry.id}>
              <Entry>
                Turn {entry.number}
                {entry.treasuryDelta
                  ? ` · treasury ${entry.treasuryDelta > 0 ? '+' : '−'}${formatGold(Math.abs(entry.treasuryDelta))}`
                  : ''}
                {entry.committedAt
                  ? ` · ${entry.committedAt.toLocaleDateString()}`
                  : ''}
              </Entry>
              <ul>
                {entry.lines.map((line, index) => (
                  <li key={`${index}-${line}`}>{line}</li>
                ))}
              </ul>
            </li>
          ))}
        </History>
      </Modal>
    </Wrapper>
  );
};

type TurnModalBodyProps = Pick<
  BastionTurnViewProps,
  | 'turn'
  | 'isSaving'
  | 'error'
  | 'preview'
  | 'isPreviewing'
  | 'onSave'
  | 'onRequestPreview'
  | 'onDiscard'
> & {
  finished: { number: number; lines: Array<string> } | null;
  context: TurnContext;
  onCommit: () => Promise<unknown>;
  onClose: () => void;
};

/** What the turn dialog shows: the summary once done, else the wizard. */
const TurnModalBody = ({
  finished,
  turn,
  context,
  onClose,
  ...wizard
}: TurnModalBodyProps) => {
  if (finished) {
    return (
      <Done>
        <DoneTitle>Turn {finished.number} is done</DoneTitle>
        <ul>
          {finished.lines.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
        <div>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </Done>
    );
  }

  if (!turn) return null;

  return (
    <TurnWizard
      key={turn.id}
      context={context}
      initialDraft={turn.draft}
      {...wizard}
    />
  );
};
