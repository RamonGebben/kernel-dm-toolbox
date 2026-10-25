'use client';

import { EmptyState } from '~/atoms/EmptyState';
import { Button } from '~/atoms/Button';
import { FormattedText } from '~/molecules/FormattedText';
import type { Statblock } from '~/server/trpc/helpers/buildStatblock';
import { NameRow } from '~/organisms/StatblockPanel/components/StatblockView/components/NameRow';
import { StatblockName } from '~/atoms/StatblockName';
import { CustomActions } from '~/organisms/StatblockPanel/components/StatblockView/components/CustomActions';
import { Ruleset } from '~/organisms/StatblockPanel/components/StatblockView/components/Ruleset';
import { Subtitle } from '~/organisms/StatblockPanel/components/StatblockView/components/Subtitle';
import { StatblockRule } from '~/atoms/StatblockRule';
import { StatblockLine } from '~/atoms/StatblockLine';
import { StatblockKey } from '~/atoms/StatblockKey';
import { Abilities } from '~/organisms/StatblockPanel/components/StatblockView/components/Abilities';
import { AbilityKey } from '~/organisms/StatblockPanel/components/StatblockView/components/AbilityKey';
import { AbilityScore } from '~/organisms/StatblockPanel/components/StatblockView/components/AbilityScore';
import { SectionTitle } from '~/organisms/StatblockPanel/components/StatblockView/components/SectionTitle';
import { StatblockEntry } from '~/atoms/StatblockEntry';
import { StatblockEntryName } from '~/atoms/StatblockEntryName';
import { EntryDesc } from '~/organisms/StatblockPanel/components/StatblockView/components/EntryDesc';
import { Skeleton } from '~/atoms/Skeleton';

export interface StatblockViewProps {
  isPending: boolean;
  statblock: Statblock | null;
  /** True once a creature/combatant is targeted, even if its statblock
   * failed to load — distinguishes "nothing picked yet" from "the thing
   * that was picked is gone" so a deleted custom creature doesn't read as
   * if the DM never selected anything. */
  hasSelection?: boolean;
  /** Only a DM-authored creature can be edited or deleted — the library is
   * read only. */
  isCustom?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * The right-hand panel. Purely presentational — every derived value (ability
 * modifiers, XP, proficiency bonus, the speed and senses prose) arrives
 * precomputed from `buildStatblock`, which is where it is tested.
 */
export const StatblockView = ({
  isPending,
  statblock,
  hasSelection = false,
  isCustom = false,
  onEdit,
  onDelete,
}: StatblockViewProps) => {
  if (isPending)
    return <Skeleton $height="20rem" aria-label="Loading statblock" />;

  if (!statblock && hasSelection) {
    return (
      <EmptyState
        title="Creature unavailable"
        description="This creature no longer exists. It may have been deleted."
      />
    );
  }

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
        <StatblockName>{statblock.name}</StatblockName>
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

      <StatblockRule />

      <StatblockLine>
        <StatblockKey>Armor Class</StatblockKey> {statblock.armorClass}
        {statblock.armorDetail ? ` (${statblock.armorDetail})` : ''}
      </StatblockLine>
      <StatblockLine>
        <StatblockKey>Hit Points</StatblockKey> {statblock.hitPoints} (
        {statblock.hitDice})
      </StatblockLine>
      <StatblockLine>
        <StatblockKey>Speed</StatblockKey> {statblock.speed}
      </StatblockLine>

      <StatblockRule />

      <Abilities>
        {statblock.abilities.map(ability => (
          <div key={ability.key}>
            <AbilityKey>{ability.key}</AbilityKey>
            <AbilityScore>
              {ability.score} ({ability.modifier})
            </AbilityScore>
          </div>
        ))}
      </Abilities>

      <StatblockRule />

      <EntryLine label="Saves" entries={statblock.savingThrows} />
      <EntryLine label="Skills" entries={statblock.skills} />
      <StatblockLine>
        <StatblockKey>Senses</StatblockKey> {statblock.senses}
      </StatblockLine>
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
      <StatblockLine>
        <StatblockKey>Challenge</StatblockKey> {statblock.challengeRatingLabel}{' '}
        ({statblock.experiencePoints.toLocaleString()} XP){' '}
        <StatblockKey>Proficiency Bonus</StatblockKey> +
        {statblock.proficiencyBonus}
      </StatblockLine>

      {statblock.traits.length > 0 && (
        <>
          <SectionTitle>Traits</SectionTitle>
          {statblock.traits.map(trait => (
            <StatblockEntry key={trait.slug}>
              <StatblockEntryName>{trait.name}.</StatblockEntryName>
              <EntryDesc>
                <FormattedText text={trait.desc} canApplyToCombatants />
              </EntryDesc>
            </StatblockEntry>
          ))}
        </>
      )}

      {statblock.actionSections.map(section => (
        <section key={section.key}>
          <SectionTitle>{section.title}</SectionTitle>
          {section.actions.map(action => (
            <StatblockEntry key={action.slug}>
              <StatblockEntryName>
                {action.name}
                {action.legendaryActionCost && action.legendaryActionCost > 1
                  ? ` (Costs ${action.legendaryActionCost} Actions)`
                  : ''}
                .
              </StatblockEntryName>
              <EntryDesc>
                <FormattedText text={action.desc} canApplyToCombatants />
              </EntryDesc>
            </StatblockEntry>
          ))}
        </section>
      ))}
    </article>
  );
};

interface EntryLineProps {
  label: string;
  entries: ReadonlyArray<{ label: string; value: string }>;
}

/** Omits itself entirely when the creature has none — a blank row reads as a bug. */
const EntryLine = ({ label, entries }: EntryLineProps) => {
  if (!entries.length) return null;

  return (
    <StatblockLine>
      <StatblockKey>{label}</StatblockKey>{' '}
      {entries.map(entry => `${entry.label} ${entry.value}`).join(', ')}
    </StatblockLine>
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
    <StatblockLine>
      <StatblockKey>{label}</StatblockKey> {value}
    </StatblockLine>
  );
};
