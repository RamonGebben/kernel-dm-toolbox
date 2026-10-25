'use client';

import { EmptyState } from '~/atoms/EmptyState';
import { FormattedText } from '~/molecules/FormattedText';
import type { SpellDetail } from '~/server/trpc/helpers/buildSpellDetail';
import { StatblockName } from '~/atoms/StatblockName';
import { Subtitle } from '~/organisms/SpellDetailPanel/components/SpellDetailView/components/Subtitle';
import { StatblockRule } from '~/atoms/StatblockRule';
import { StatblockLine } from '~/atoms/StatblockLine';
import { StatblockKey } from '~/atoms/StatblockKey';
import { Desc } from '~/organisms/SpellDetailPanel/components/SpellDetailView/components/Desc';
import { SectionTitle } from '~/organisms/SpellDetailPanel/components/SpellDetailView/components/SectionTitle';
import { StatblockEntry } from '~/atoms/StatblockEntry';
import { StatblockEntryName } from '~/atoms/StatblockEntryName';
import { EntryDesc } from '~/organisms/SpellDetailPanel/components/SpellDetailView/components/EntryDesc';
import { Skeleton } from '~/atoms/Skeleton';

export interface SpellDetailViewProps {
  isPending: boolean;
  spell: SpellDetail | null;
}

/**
 * The body of the spell lookup pane. Purely presentational — every derived
 * value (the subtitle, the components string, the duration prefix, …) arrives
 * precomputed from `buildSpellDetail`, which is where it is tested.
 */
export const SpellDetailView = ({ isPending, spell }: SpellDetailViewProps) => {
  if (isPending) return <Skeleton $height="20rem" aria-label="Loading spell" />;

  if (!spell) {
    return (
      <EmptyState
        title="Nothing selected"
        description="Pick a spell from the list to see its description."
      />
    );
  }

  return (
    <article>
      <StatblockName>{spell.name}</StatblockName>
      <Subtitle>{spell.subtitle}</Subtitle>

      <StatblockRule />

      <StatblockLine>
        <StatblockKey>Casting Time</StatblockKey> {spell.castingTime}
        {spell.reactionCondition ? ` (${spell.reactionCondition})` : ''}
      </StatblockLine>
      <StatblockLine>
        <StatblockKey>Range</StatblockKey> {spell.rangeLabel}
      </StatblockLine>
      <StatblockLine>
        <StatblockKey>Components</StatblockKey> {spell.componentsLabel}
      </StatblockLine>
      <StatblockLine>
        <StatblockKey>Duration</StatblockKey> {spell.durationLabel}
      </StatblockLine>
      <ValueLine label="Target" value={spell.targetLabel} />
      <ValueLine label="Area of Effect" value={spell.shapeLabel} />
      <ValueLine label="Saving Throw" value={spell.savingThrowLabel} />
      {spell.attackRoll && (
        <StatblockLine>Requires a spell attack roll.</StatblockLine>
      )}
      <ValueLine label="Damage" value={spell.damageRoll} />
      {spell.damageTypes.length > 0 && (
        <StatblockLine>
          <StatblockKey>Damage Type</StatblockKey>{' '}
          {spell.damageTypes.join(', ')}
        </StatblockLine>
      )}
      {spell.classes.length > 0 && (
        <StatblockLine>
          <StatblockKey>Classes</StatblockKey> {spell.classes.join(', ')}
        </StatblockLine>
      )}

      <StatblockRule />

      <Desc>
        <FormattedText text={spell.desc} />
      </Desc>

      {spell.higherLevel && (
        <>
          <SectionTitle>At Higher Levels</SectionTitle>
          <Desc>
            <FormattedText text={spell.higherLevel} />
          </Desc>
        </>
      )}

      {spell.castingOptions.length > 0 && (
        <>
          <SectionTitle>Casting Options</SectionTitle>
          {spell.castingOptions.map(option => (
            <StatblockEntry key={option.id}>
              <StatblockEntryName>{option.label}.</StatblockEntryName>
              <CastingOptionDetail option={option} />
            </StatblockEntry>
          ))}
        </>
      )}
    </article>
  );
};

interface CastingOptionDetailProps {
  option: SpellDetail['castingOptions'][number];
}

/** Everything upstream supplies for a scaling slot — omitting whatever it left blank. */
const CastingOptionDetail = ({ option }: CastingOptionDetailProps) => (
  <>
    {option.desc && (
      <EntryDesc>
        <FormattedText text={option.desc} />
      </EntryDesc>
    )}
    {option.damageRoll && (
      <StatblockLine>
        <StatblockKey>Damage</StatblockKey> {option.damageRoll}
      </StatblockLine>
    )}
    {option.duration && (
      <StatblockLine>
        <StatblockKey>Duration</StatblockKey> {option.duration}
      </StatblockLine>
    )}
    {option.range && (
      <StatblockLine>
        <StatblockKey>Range</StatblockKey> {option.range}
      </StatblockLine>
    )}
    {option.targetCount != null && (
      <StatblockLine>
        <StatblockKey>Targets</StatblockKey> {option.targetCount}
      </StatblockLine>
    )}
    {option.shapeSize != null && (
      <StatblockLine>
        <StatblockKey>Size</StatblockKey> {option.shapeSize} ft.
      </StatblockLine>
    )}
  </>
);

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
