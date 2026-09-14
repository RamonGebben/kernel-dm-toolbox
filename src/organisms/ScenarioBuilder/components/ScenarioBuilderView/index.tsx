'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { TextInput } from '~/atoms/TextInput';
import {
  PlacementGrid,
  type PlacementGridCell,
  type PlacementGridToken,
} from '~/organisms/ScenarioBuilder/components/ScenarioBuilderView/components/PlacementGrid';

export type BuilderScenario = {
  id: string;
  name: string;
  note: string | null;
  trialCount: number;
};

export type BuilderPosition = { x: number; y: number };

export type BuilderPartyMember = {
  id: string;
  playerCharacterId: string;
  name: string;
  level: number;
  position: BuilderPosition | null;
};

export type BuilderMonsterEntry = {
  id: string;
  name: string;
  challengeRatingLabel: string;
  count: number;
  position: BuilderPosition | null;
};

export type RosterOption = {
  id: string;
  name: string;
  level: number;
  /** Null means no class/subclass has been applied via the class wizard yet
   * — such a PC has no materialized actions, so the engine simulates it as
   * present on the board but never attacking (see `loadScenarioCombatants`).
   * Flagged here so a DM picks it knowingly rather than discovering it mid-
   * fight. */
  characterClassSlug: string | null;
};

export type CreatureOption = {
  key: string;
  name: string;
  challengeRatingLabel: string;
  source: 'library' | 'custom';
  creatureSlug?: string;
  customCreatureId?: string;
};

export type ScenarioBuilderViewProps = {
  scenario: BuilderScenario | null;
  isDetailPending: boolean;
  party: readonly BuilderPartyMember[];
  monsters: readonly BuilderMonsterEntry[];
  /** The full character roster, unfiltered — `AddPartyMemberForm` filters out
   * PCs already in this scenario itself, so it can tell "nobody's on the
   * roster at all" apart from "everyone's already added" instead of showing
   * the same message for both. */
  roster: readonly RosterOption[];
  creatureOptions: readonly CreatureOption[];
  isCreatureOptionsPending: boolean;
  monsterSearch: string;
  onMonsterSearchChange: (value: string) => void;
  armedTokenKey: string | null;
  onArmToken: (key: string) => void;
  onPlaceCell: (cell: PlacementGridCell) => void;
  onClearPosition: (key: string) => void;
  onUpdateScenario: (values: {
    name: string;
    note: string;
    trialCount: number;
  }) => void;
  onAddPartyMember: (playerCharacterId: string) => void;
  onRemovePartyMember: (id: string) => void;
  onAddMonsterEntry: (option: CreatureOption) => void;
  onUpdateMonsterEntryCount: (id: string, count: number) => void;
  onRemoveMonsterEntry: (id: string) => void;
};

const PARTY_TOKEN_COLOR = '#6fa7ff';
const MONSTER_TOKEN_COLOR = '#ff6f6f';

const partyTokenKey = (id: string) => `party:${id}`;
const monsterTokenKey = (id: string) => `monster:${id}`;

/**
 * Presentational: a scenario's build view — party, monster group, and a grid
 * to place both on. No run/playback UI yet (issue #5, milestones 5-7).
 */
export const ScenarioBuilderView = ({
  scenario,
  isDetailPending,
  party,
  monsters,
  roster,
  creatureOptions,
  isCreatureOptionsPending,
  monsterSearch,
  onMonsterSearchChange,
  armedTokenKey,
  onArmToken,
  onPlaceCell,
  onClearPosition,
  onUpdateScenario,
  onAddPartyMember,
  onRemovePartyMember,
  onAddMonsterEntry,
  onUpdateMonsterEntryCount,
  onRemoveMonsterEntry,
}: ScenarioBuilderViewProps) => {
  if (!scenario) {
    return (
      <EmptyState
        title="No scenario selected"
        description="Create a scenario or pick one from the list to start building a fight."
      />
    );
  }

  if (isDetailPending) {
    return <Skeleton role="status" aria-label="Loading scenario" />;
  }

  const tokens: PlacementGridToken[] = [
    ...party.map(member => ({
      key: partyTokenKey(member.id),
      label: member.name,
      color: PARTY_TOKEN_COLOR,
      position: member.position,
    })),
    ...monsters.map(entry => ({
      key: monsterTokenKey(entry.id),
      label: entry.name,
      color: MONSTER_TOKEN_COLOR,
      position: entry.position,
    })),
  ];

  const addedPlayerCharacterIds = new Set(
    party.map(member => member.playerCharacterId),
  );
  const availableRoster = roster.filter(
    pc => !addedPlayerCharacterIds.has(pc.id),
  );

  return (
    <Wrapper>
      <ScenarioHeader scenario={scenario} onUpdateScenario={onUpdateScenario} />

      <Sections>
        <Section>
          <SectionTitle>Party</SectionTitle>
          <AddPartyMemberForm
            roster={availableRoster}
            hasAnyCharacters={roster.length > 0}
            onAdd={onAddPartyMember}
          />
          <TokenList>
            {party.map(member => (
              <TokenCard key={member.id}>
                <TokenSwatch $color={PARTY_TOKEN_COLOR} />
                <TokenLabel>
                  {member.name} <Muted>(lvl {member.level})</Muted>
                </TokenLabel>
                <PositionLabel position={member.position} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onArmToken(partyTokenKey(member.id))}
                  aria-pressed={armedTokenKey === partyTokenKey(member.id)}
                >
                  Place
                </Button>
                {member.position && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onClearPosition(partyTokenKey(member.id))}
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${member.name} from the party`}
                  onClick={() => onRemovePartyMember(member.id)}
                >
                  Remove
                </Button>
              </TokenCard>
            ))}
            {!party.length && <Muted>No party members yet.</Muted>}
          </TokenList>
        </Section>

        <Section>
          <SectionTitle>Monsters</SectionTitle>
          <AddMonsterEntryForm
            search={monsterSearch}
            onSearchChange={onMonsterSearchChange}
            options={creatureOptions}
            isPending={isCreatureOptionsPending}
            onAdd={onAddMonsterEntry}
          />
          <TokenList>
            {monsters.map(entry => (
              <TokenCard key={entry.id}>
                <TokenSwatch $color={MONSTER_TOKEN_COLOR} />
                <TokenLabel>
                  {entry.name} <Muted>CR {entry.challengeRatingLabel}</Muted>
                </TokenLabel>
                <CountInput
                  type="number"
                  min={1}
                  max={50}
                  value={entry.count}
                  aria-label={`Count of ${entry.name}`}
                  onChange={event => {
                    const next = Number(event.target.value);
                    if (Number.isInteger(next) && next >= 1) {
                      onUpdateMonsterEntryCount(entry.id, next);
                    }
                  }}
                />
                <PositionLabel position={entry.position} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onArmToken(monsterTokenKey(entry.id))}
                  aria-pressed={armedTokenKey === monsterTokenKey(entry.id)}
                >
                  Place
                </Button>
                {entry.position && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onClearPosition(monsterTokenKey(entry.id))}
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${entry.name} from the scenario`}
                  onClick={() => onRemoveMonsterEntry(entry.id)}
                >
                  Remove
                </Button>
              </TokenCard>
            ))}
            {!monsters.length && <Muted>No monsters yet.</Muted>}
          </TokenList>
        </Section>

        <Section>
          <SectionTitle>Grid</SectionTitle>
          <GridHint>
            Click &ldquo;Place&rdquo; on a party member or monster, then click a
            cell.
          </GridHint>
          <PlacementGrid
            tokens={tokens}
            armedKey={armedTokenKey}
            onPlaceCell={onPlaceCell}
          />
        </Section>
      </Sections>
    </Wrapper>
  );
};

type PositionLabelProps = { position: BuilderPosition | null };

const PositionLabel = ({ position }: PositionLabelProps) =>
  position ? (
    <Muted>
      ({position.x}, {position.y})
    </Muted>
  ) : (
    <Muted>auto-place</Muted>
  );

type ScenarioHeaderProps = {
  scenario: BuilderScenario;
  onUpdateScenario: ScenarioBuilderViewProps['onUpdateScenario'];
};

/** Re-keyed by `scenario.id` from the parent so switching scenarios resets
 * this uncontrolled-feeling local draft instead of leaking the previous
 * scenario's edits into the newly selected one. */
const ScenarioHeader = ({
  scenario,
  onUpdateScenario,
}: ScenarioHeaderProps) => {
  const [name, setName] = useState(scenario.name);
  const [note, setNote] = useState(scenario.note ?? '');
  const [trialCount, setTrialCount] = useState(scenario.trialCount);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onUpdateScenario({ name: name.trim(), note: note.trim(), trialCount });
  };

  return (
    <HeaderForm onSubmit={handleSubmit} key={scenario.id}>
      <TextInput
        value={name}
        aria-label="Scenario name"
        onChange={event => setName(event.target.value)}
      />
      <TextInput
        value={note}
        placeholder="Note (optional)"
        aria-label="Scenario note"
        onChange={event => setNote(event.target.value)}
      />
      <TrialCountInput
        type="number"
        min={1}
        max={10000}
        value={trialCount}
        aria-label="Monte Carlo trial count"
        onChange={event => setTrialCount(Number(event.target.value))}
      />
      <Button type="submit" size="sm">
        Save
      </Button>
    </HeaderForm>
  );
};

type AddPartyMemberFormProps = {
  roster: readonly RosterOption[];
  /** Whether the character roster has anyone on it at all, independent of
   * how many are already in this scenario — see `roster`'s own doc comment
   * on `ScenarioBuilderViewProps`. */
  hasAnyCharacters: boolean;
  onAdd: (playerCharacterId: string) => void;
};

const AddPartyMemberForm = ({
  roster,
  hasAnyCharacters,
  onAdd,
}: AddPartyMemberFormProps) => {
  const [selectedId, setSelectedId] = useState('');

  if (!roster.length) {
    return (
      <Muted>
        {hasAnyCharacters
          ? 'Every character on the roster is already in this scenario.'
          : 'No characters on the roster yet — add one in the Characters tool first.'}
      </Muted>
    );
  }

  return (
    <AddForm
      onSubmit={event => {
        event.preventDefault();
        if (!selectedId) return;
        onAdd(selectedId);
        setSelectedId('');
      }}
    >
      <Select
        value={selectedId}
        aria-label="Add a character to the party"
        onChange={event => setSelectedId(event.target.value)}
      >
        <option value="">Add a character…</option>
        {roster.map(pc => (
          <option key={pc.id} value={pc.id}>
            {pc.name} (lvl {pc.level})
            {pc.characterClassSlug === null ? ' — no class, won’t attack' : ''}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={!selectedId}>
        Add
      </Button>
    </AddForm>
  );
};

type AddMonsterEntryFormProps = {
  search: string;
  onSearchChange: (value: string) => void;
  options: readonly CreatureOption[];
  isPending: boolean;
  onAdd: (option: CreatureOption) => void;
};

const AddMonsterEntryForm = ({
  search,
  onSearchChange,
  options,
  isPending,
  onAdd,
}: AddMonsterEntryFormProps) => {
  const [selectedKey, setSelectedKey] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const option = options.find(candidate => candidate.key === selectedKey);
    if (!option) return;
    onAdd(option);
    setSelectedKey('');
  };

  return (
    <AddForm onSubmit={handleSubmit}>
      <TextInput
        value={search}
        placeholder="Search creatures…"
        aria-label="Search creatures to add"
        onChange={event => onSearchChange(event.target.value)}
      />
      <Select
        value={selectedKey}
        aria-label="Add a creature to the monster group"
        disabled={isPending}
        onChange={event => setSelectedKey(event.target.value)}
      >
        <option value="">{isPending ? 'Loading…' : 'Add a creature…'}</option>
        {options.map(option => (
          <option key={option.key} value={option.key}>
            {option.name} (CR {option.challengeRatingLabel})
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={!selectedKey}>
        Add
      </Button>
    </AddForm>
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

const HeaderForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.sm};
  align-items: center;
`;

const TrialCountInput = styled(TextInput)`
  max-width: 8rem;
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.lg};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.md};
  color: ${props => props.theme.color.textPrimary};
`;

const AddForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.sm};
`;

const Select = styled.select`
  flex: 1;
  min-width: 12rem;
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
`;

const TokenList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const TokenCard = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const TokenSwatch = styled.span<{ $color: string }>`
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: ${props => props.$color};
`;

const TokenLabel = styled.span`
  flex: 1;
  min-width: 8rem;
  color: ${props => props.theme.color.textPrimary};
`;

const CountInput = styled.input`
  width: 3.5rem;
  padding: ${props => props.theme.space.xs};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
`;

const Muted = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const GridHint = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Skeleton = styled.div`
  height: 16rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
