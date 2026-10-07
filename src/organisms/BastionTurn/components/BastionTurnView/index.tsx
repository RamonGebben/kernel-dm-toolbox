'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { Modal } from '~/atoms/Modal';
import type { TurnContext } from '~/server/trpc/helpers/bastionTurnPlan';
import type { TurnDraft } from '~/server/trpc/schemas/bastionTurns';
import { formatGold } from '~/utils/applyGoldChange';
import { TurnWizard } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard';
import type { TurnPreview } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep';

export type TurnHistoryEntry = {
  id: string;
  number: number;
  committedAt: Date | null;
  lines: string[];
  treasuryDelta: number;
};

export type BastionTurnViewProps = {
  isPending: boolean;
  context: TurnContext | null;
  turn: { id: string; number: number; draft: TurnDraft } | null;
  history: readonly TurnHistoryEntry[];
  isSaving: boolean;
  error: string | null;
  preview: TurnPreview | null;
  isPreviewing: boolean;
  onStart: () => Promise<unknown>;
  onSave: (draft: TurnDraft) => Promise<unknown>;
  onRequestPreview: (draft: TurnDraft) => void;
  onDiscard: () => void;
  onCommit: () => Promise<{ lines: string[] } | null>;
};

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
    lines: string[];
  } | null>(null);

  if (isPending || !context) return null;
  if (!context.bastions.length && !history.length) return null;

  const open = async () => {
    setFinished(null);
    if (!turn) await onStart();
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
  finished: { number: number; lines: string[] } | null;
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

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  border: 1px solid ${props => props.theme.color.accent};
  border-radius: ${props => props.theme.radius.sm};
  margin-bottom: ${props => props.theme.space.md};
`;

const Text = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.xs};
`;

const History = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  margin: 0;
  padding: 0;
  list-style: none;
  color: ${props => props.theme.color.textPrimary};

  ul {
    margin: ${props => props.theme.space.xs} 0 0;
    padding-left: ${props => props.theme.space.md};
  }
`;

const Done = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  color: ${props => props.theme.color.textPrimary};

  ul {
    margin: 0;
    padding-left: ${props => props.theme.space.md};
  }
`;

const DoneTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
`;

const Entry = styled.p`
  margin: 0;
  font-weight: 600;
`;
