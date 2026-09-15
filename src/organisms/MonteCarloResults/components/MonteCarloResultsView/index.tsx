'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { TextInput } from '~/atoms/TextInput';
import { MAX_TRIAL_COUNT } from '~/server/trpc/schemas/simulator';
import { formatPercent } from '~/utils/formatPercent';
import { RoundDistributionChart } from '~/organisms/MonteCarloResults/components/MonteCarloResultsView/components/RoundDistributionChart';
import { CombatantStatsTable } from '~/organisms/MonteCarloResults/components/MonteCarloResultsView/components/CombatantStatsTable';
import type { SimulatorScenario } from '~/server/db/schema';

export type MonteCarloResultsViewProps = {
  hasScenario: boolean;
  isDetailPending: boolean;
  scenario: SimulatorScenario | null;
  /** A scenario needs at least one party member and one monster before it
   * can run — mirrors the same guard `runBatch` itself enforces. */
  canRun: boolean;
  isRunning: boolean;
  runErrorMessage: string | null;
  onRunBatch: (trialCount: number) => void;
  isSavingPreset: boolean;
  savePresetErrorMessage: string | null;
  onSaveAsPreset: (name: string) => Promise<void>;
};

type TrialRunFormProps = {
  defaultTrialCount: number;
  isRunning: boolean;
  onRunBatch: (trialCount: number) => void;
};

/** Re-keyed by `scenario.id` from the parent (same pattern as
 * `ScenarioBuilderView`'s own `ScenarioHeader`) so switching scenarios
 * resets this local draft back to the newly selected scenario's own stored
 * trial count instead of carrying over the previous one. */
const TrialRunForm = ({
  defaultTrialCount,
  isRunning,
  onRunBatch,
}: TrialRunFormProps) => {
  const [trialCount, setTrialCount] = useState(defaultTrialCount);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onRunBatch(trialCount);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <TrialCountInput
        type="number"
        min={1}
        max={MAX_TRIAL_COUNT}
        value={trialCount}
        aria-label="Number of trials"
        onChange={event => setTrialCount(Number(event.target.value))}
      />
      <Button type="submit" size="sm" disabled={isRunning}>
        {isRunning ? 'Running…' : 'Run batch'}
      </Button>
    </Form>
  );
};

type SavePresetFormProps = {
  isSaving: boolean;
  onSaveAsPreset: (name: string) => Promise<void>;
};

/** Re-keyed by `scenario.id` from the parent, same reasoning as
 * `TrialRunForm`'s own key — a "Saved as…" confirmation from a previous
 * scenario must not linger once the DM switches to a different one. */
const SavePresetForm = ({ isSaving, onSaveAsPreset }: SavePresetFormProps) => {
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    const trimmed = name.trim();
    try {
      await onSaveAsPreset(trimmed);
      setSavedName(trimmed);
      setName('');
    } catch {
      // The error surfaces via `savePresetErrorMessage` in the parent.
    }
  };

  return (
    <SaveForm onSubmit={handleSubmit}>
      <TextInput
        value={name}
        placeholder="Save as Encounter Preset…"
        aria-label="Name for the saved encounter preset"
        disabled={isSaving}
        onChange={event => {
          setName(event.target.value);
          setSavedName(null);
        }}
      />
      <Button type="submit" size="sm" disabled={isSaving || !name.trim()}>
        {isSaving ? 'Saving…' : 'Save as preset'}
      </Button>
      {savedName && (
        <SavedText role="status">Saved as “{savedName}”.</SavedText>
      )}
    </SaveForm>
  );
};

/**
 * Presentational: a scenario's Monte Carlo balance check (issue #5,
 * milestone 6) — a trial-count input, a "Run batch" control, and (once a
 * scenario has been run at least once) win rate, round-length distribution,
 * and per-combatant survival/damage/kill stats read straight off the
 * scenario's own cached `lastRunSummary`. Owns no mutation/query of its own;
 * every state arrives as a prop from `MonteCarloResults`, the connected
 * boundary.
 */
export const MonteCarloResultsView = ({
  hasScenario,
  isDetailPending,
  scenario,
  canRun,
  isRunning,
  runErrorMessage,
  onRunBatch,
  isSavingPreset,
  savePresetErrorMessage,
  onSaveAsPreset,
}: MonteCarloResultsViewProps) => {
  if (!hasScenario) {
    return (
      <EmptyState
        title="No scenario selected"
        description="Create a scenario or pick one from the list to run a Monte Carlo balance check."
      />
    );
  }

  if (isDetailPending || !scenario) {
    return <Skeleton role="status" aria-label="Loading scenario" />;
  }

  if (!canRun) {
    return (
      <EmptyState
        title="Not ready to run"
        description="Add at least one party member and one monster on the Build tab before running a batch."
      />
    );
  }

  const summary = scenario.lastRunSummary;

  return (
    <Wrapper>
      <TopBar key={scenario.id}>
        <TrialRunForm
          defaultTrialCount={scenario.trialCount}
          isRunning={isRunning}
          onRunBatch={onRunBatch}
        />
        {scenario.lastRunAt && (
          <LastRun>
            Last run {new Date(scenario.lastRunAt).toLocaleString()}
          </LastRun>
        )}
      </TopBar>

      {runErrorMessage && <ErrorText role="alert">{runErrorMessage}</ErrorText>}

      {/* Only worth saving once the DM has actually seen a balance check —
          matches the issue's own "visible once it's been run at least once"
          rule, enforced server-side too in `simulator.saveAsPreset`. */}
      {scenario.lastRunAt && (
        <SavePresetForm
          key={scenario.id}
          isSaving={isSavingPreset}
          onSaveAsPreset={onSaveAsPreset}
        />
      )}
      {savePresetErrorMessage && (
        <ErrorText role="alert">{savePresetErrorMessage}</ErrorText>
      )}

      {!summary && !isRunning && (
        <EmptyState
          title="No results yet"
          description="Run a batch to see win rate, round length and per-combatant stats."
        />
      )}

      {summary && (
        <Content>
          <Headline>
            <Stat>
              <StatValue>{formatPercent(summary.partyWinRate)}</StatValue>
              <StatLabel>Party wins</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{formatPercent(summary.monsterWinRate)}</StatValue>
              <StatLabel>Monsters win</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{formatPercent(summary.drawRate)}</StatValue>
              <StatLabel>Draws</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{summary.roundsMean.toFixed(1)}</StatValue>
              <StatLabel>Avg. rounds</StatLabel>
            </Stat>
          </Headline>

          <Section>
            <SectionTitle>Round length</SectionTitle>
            <RoundDistributionChart buckets={summary.roundDistribution} />
          </Section>

          <Section>
            <SectionTitle>Combatants</SectionTitle>
            <CombatantStatsTable combatants={summary.combatants} />
          </Section>

          <Muted>
            {summary.trialCount} trials, base seed {summary.baseSeed}.
          </Muted>
        </Content>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  height: 100%;
  min-height: 0;
  overflow-y: auto;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.md};
  flex-wrap: wrap;
`;

const Form = styled.form`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
`;

const TrialCountInput = styled(TextInput)`
  max-width: 8rem;
`;

const LastRun = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${props => props.theme.color.danger};
  font-size: ${props => props.theme.fontSize.sm};
`;

const SaveForm = styled.form`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  flex-wrap: wrap;
`;

const SavedText = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.lg};
`;

const Headline = styled.div`
  display: flex;
  gap: ${props => props.theme.space.lg};
  flex-wrap: wrap;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.span`
  font-size: ${props => props.theme.fontSize.lg};
  font-weight: 700;
  color: ${props => props.theme.color.textPrimary};
`;

const StatLabel = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Muted = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Skeleton = styled.div`
  height: 16rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
