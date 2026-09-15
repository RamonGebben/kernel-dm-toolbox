'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { TextInput } from '~/atoms/TextInput';

export type ScenarioSummary = {
  id: string;
  name: string;
  note: string | null;
  trialCount: number;
  partyCount: number;
  monsterCount: number;
};

export type ScenarioListViewProps = {
  isPending: boolean;
  isCreating: boolean;
  scenarios: readonly ScenarioSummary[];
  selectedScenarioId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRemove: (id: string) => void;
};

/**
 * Presentational: the scenario list plus the box that starts a new one.
 * Selecting a scenario swaps what the build view (`ScenarioBuilder`) shows —
 * this component owns none of that state itself.
 */
export const ScenarioListView = ({
  isPending,
  isCreating,
  scenarios,
  selectedScenarioId,
  onSelect,
  onCreate,
  onRemove,
}: ScenarioListViewProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    onCreate(name.trim());
    setName('');
  };

  return (
    <Wrapper>
      <CreateForm onSubmit={handleSubmit}>
        <TextInput
          value={name}
          placeholder="New scenario…"
          aria-label="Name for the new scenario"
          onChange={event => setName(event.target.value)}
        />
        <Button type="submit" size="sm" disabled={isCreating || !name.trim()}>
          Create
        </Button>
      </CreateForm>

      <Results>
        <ScenariosBody
          isPending={isPending}
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      </Results>
    </Wrapper>
  );
};

type ScenariosBodyProps = Pick<
  ScenarioListViewProps,
  'isPending' | 'scenarios' | 'selectedScenarioId' | 'onSelect' | 'onRemove'
>;

/** A named subcomponent rather than a local const, so the guards stay guards. */
const ScenariosBody = ({
  isPending,
  scenarios,
  selectedScenarioId,
  onSelect,
  onRemove,
}: ScenariosBodyProps) => {
  if (isPending)
    return <Skeleton role="status" aria-label="Loading scenarios" />;

  if (!scenarios.length) {
    return (
      <EmptyState
        title="No scenarios yet"
        description="Build a party and a monster group, then run the fight to see how it balances."
      />
    );
  }

  return (
    <List>
      {scenarios.map(scenario => (
        <li key={scenario.id}>
          <Card $isSelected={scenario.id === selectedScenarioId}>
            <CardHeader>
              <SelectButton
                type="button"
                onClick={() => onSelect(scenario.id)}
                aria-pressed={scenario.id === selectedScenarioId}
              >
                <ScenarioName>{scenario.name}</ScenarioName>
                <Meta>
                  {scenario.partyCount}{' '}
                  {scenario.partyCount === 1 ? 'PC' : 'PCs'} ·{' '}
                  {scenario.monsterCount}{' '}
                  {scenario.monsterCount === 1 ? 'monster' : 'monsters'}
                </Meta>
              </SelectButton>
              <RemoveButton
                variant="ghost"
                size="sm"
                aria-label={`Delete ${scenario.name}`}
                onClick={() => onRemove(scenario.id)}
              >
                Delete
              </RemoveButton>
            </CardHeader>
          </Card>
        </li>
      ))}
    </List>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  height: 100%;
  min-height: 0;
`;

const CreateForm = styled.form`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;

const Results = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Card = styled.div<{ $isSelected: boolean }>`
  width: 100%;
  padding: ${props => props.theme.space.md};
  background: ${props =>
    props.$isSelected
      ? props.theme.color.surfaceRaised
      : props.theme.color.canvas};
  border: 1px solid
    ${props =>
      props.$isSelected ? props.theme.color.accent : props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

/**
 * The name/count is the click target that selects a scenario; the delete
 * button sits beside it as a sibling rather than nested inside it — two
 * focusable controls nested inside one another fails
 * `nested-interactive` and, worse, isn't valid HTML (a `<button>` inside a
 * `<button>`).
 */
const SelectButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${props => props.theme.space.xs};
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
`;

const ScenarioName = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.md};
  color: ${props => props.theme.color.textPrimary};
`;

const RemoveButton = styled(Button)`
  flex-shrink: 0;
`;

const Meta = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Skeleton = styled.div`
  height: 8rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
