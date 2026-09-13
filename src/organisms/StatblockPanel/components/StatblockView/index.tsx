'use client';

import styled from 'styled-components';
import { EmptyState } from '~/atoms/EmptyState';
import { Button } from '~/atoms/Button';
import { FormattedText } from '~/molecules/FormattedText';
import type { Statblock } from '~/server/trpc/helpers/buildStatblock';

export type StatblockViewProps = {
  isPending: boolean;
  statblock: Statblock | null;
  /** Only a DM-authored creature can be edited or deleted — the library is
   * read only. */
  isCustom?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

/**
 * The right-hand panel. Purely presentational — every derived value (ability
 * modifiers, XP, proficiency bonus, the speed and senses prose) arrives
 * precomputed from `buildStatblock`, which is where it is tested.
 */
export const StatblockView = ({
  isPending,
  statblock,
  isCustom = false,
  onEdit,
  onDelete,
}: StatblockViewProps) => {
  if (isPending)
    return <Skeleton role="status" aria-label="Loading statblock" />;

  if (!statblock) {
    return (
      <EmptyState
        title="Nothing selected"
        description="Pick a creature from the library to see its statblock."
      />
    );
  }

  return (
    <article>
      <NameRow>
        <Name>{statblock.name}</Name>
        {isCustom && (
          <CustomActions>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEdit}
              aria-label={`Edit ${statblock.name}`}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              aria-label={`Delete ${statblock.name}`}
            >
              Delete
            </Button>
          </CustomActions>
        )}
      </NameRow>
      <Ruleset>5e 2024 Rules</Ruleset>
      <Subtitle>{statblock.subtitle}</Subtitle>

      <Rule />

      <Line>
        <Key>Armor Class</Key> {statblock.armorClass}
        {statblock.armorDetail ? ` (${statblock.armorDetail})` : ''}
      </Line>
      <Line>
        <Key>Hit Points</Key> {statblock.hitPoints} ({statblock.hitDice})
      </Line>
      <Line>
        <Key>Speed</Key> {statblock.speed}
      </Line>

      <Rule />

      <Abilities>
        {statblock.abilities.map(ability => (
          <Ability key={ability.key}>
            <AbilityKey>{ability.key}</AbilityKey>
            <AbilityScore>
              {ability.score} ({ability.modifier})
            </AbilityScore>
          </Ability>
        ))}
      </Abilities>

      <Rule />

      <EntryLine label="Saves" entries={statblock.savingThrows} />
      <EntryLine label="Skills" entries={statblock.skills} />
      <Line>
        <Key>Senses</Key> {statblock.senses}
      </Line>
      <ValueLine label="Immunities" value={statblock.damageImmunities} />
      <ValueLine label="Resistances" value={statblock.damageResistances} />
      <ValueLine
        label="Vulnerabilities"
        value={statblock.damageVulnerabilities}
      />
      <ValueLine
        label="Condition Immunities"
        value={statblock.conditionImmunities}
      />
      <ValueLine label="Languages" value={statblock.languages} />
      <Line>
        <Key>Challenge</Key> {statblock.challengeRatingLabel} (
        {statblock.experiencePoints.toLocaleString()} XP){' '}
        <Key>Proficiency Bonus</Key> +{statblock.proficiencyBonus}
      </Line>

      {statblock.traits.length > 0 && (
        <>
          <SectionTitle>Traits</SectionTitle>
          {statblock.traits.map(trait => (
            <Entry key={trait.slug}>
              <EntryName>{trait.name}.</EntryName>
              <EntryDesc>
                <FormattedText text={trait.desc} canApplyToCombatants />
              </EntryDesc>
            </Entry>
          ))}
        </>
      )}

      {statblock.actionSections.map(section => (
        <section key={section.key}>
          <SectionTitle>{section.title}</SectionTitle>
          {section.actions.map(action => (
            <Entry key={action.slug}>
              <EntryName>
                {action.name}
                {action.legendaryActionCost && action.legendaryActionCost > 1
                  ? ` (Costs ${action.legendaryActionCost} Actions)`
                  : ''}
                .
              </EntryName>
              <EntryDesc>
                <FormattedText text={action.desc} canApplyToCombatants />
              </EntryDesc>
            </Entry>
          ))}
        </section>
      ))}
    </article>
  );
};

type EntryLineProps = {
  label: string;
  entries: readonly { label: string; value: string }[];
};

/** Omits itself entirely when the creature has none — a blank row reads as a bug. */
const EntryLine = ({ label, entries }: EntryLineProps) => {
  if (!entries.length) return null;

  return (
    <Line>
      <Key>{label}</Key>{' '}
      {entries.map(entry => `${entry.label} ${entry.value}`).join(', ')}
    </Line>
  );
};

const ValueLine = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => {
  if (!value) return null;

  return (
    <Line>
      <Key>{label}</Key> {value}
    </Line>
  );
};

const NameRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const Name = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.xl};
  letter-spacing: 0.02em;
  color: ${props => props.theme.color.accent};
`;

const CustomActions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: ${props => props.theme.space.xs};
`;

const Ruleset = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
  color: ${props => props.theme.color.textMuted};
`;

const Subtitle = styled.p`
  margin: 0 0 ${props => props.theme.space.sm};
  font-style: italic;
  color: ${props => props.theme.color.textPrimary};
`;

const Rule = styled.hr`
  margin: ${props => props.theme.space.sm} 0;
  border: none;
  border-top: 1px solid ${props => props.theme.color.accentMuted};
`;

const Line = styled.p`
  margin: 0 0 ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Key = styled.strong`
  color: ${props => props.theme.color.accent};
`;

const Abilities = styled.dl`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${props => props.theme.space.xs};
  margin: 0;
  text-align: center;
`;

const Ability = styled.div``;

const AbilityKey = styled.dt`
  font-weight: 700;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.accent};
`;

const AbilityScore = styled.dd`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  font-family: ${props => props.theme.font.mono};
  color: ${props => props.theme.color.textPrimary};
`;

const SectionTitle = styled.h4`
  margin: ${props => props.theme.space.lg} 0 ${props => props.theme.space.sm};
  padding-bottom: ${props => props.theme.space.xs};
  border-bottom: 1px solid ${props => props.theme.color.accentMuted};
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.accent};
`;

const Entry = styled.div`
  margin-bottom: ${props => props.theme.space.sm};
  font-size: ${props => props.theme.fontSize.sm};
`;

const EntryName = styled.strong`
  font-style: italic;
  color: ${props => props.theme.color.textPrimary};
`;

/**
 * A `div`, not a `p`: `FormattedText` can render block-level children (a
 * list, a table) that are invalid inside a `<p>`.
 */
const EntryDesc = styled.div`
  margin: 0;
  white-space: pre-line;
  color: ${props => props.theme.color.textMuted};
`;

const Skeleton = styled.div`
  height: 20rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
