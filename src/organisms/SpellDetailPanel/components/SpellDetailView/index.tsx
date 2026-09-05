'use client';

import styled from 'styled-components';
import { EmptyState } from '~/atoms/EmptyState';
import type { SpellDetail } from '~/server/trpc/helpers/buildSpellDetail';

export type SpellDetailViewProps = {
  isPending: boolean;
  spell: SpellDetail | null;
};

/**
 * The body of the spell lookup pane. Purely presentational — every derived
 * value (the subtitle, the components string, the duration prefix, …) arrives
 * precomputed from `buildSpellDetail`, which is where it is tested.
 */
export const SpellDetailView = ({ isPending, spell }: SpellDetailViewProps) => {
  if (isPending) return <Skeleton role="status" aria-label="Loading spell" />;

  if (!spell) {
    return (
      <EmptyState
        title="Not found"
        description="This spell could not be loaded."
      />
    );
  }

  return (
    <article>
      <Subtitle>{spell.subtitle}</Subtitle>

      <Rule />

      <Line>
        <Key>Casting Time</Key> {spell.castingTime}
        {spell.reactionCondition ? ` (${spell.reactionCondition})` : ''}
      </Line>
      <Line>
        <Key>Range</Key> {spell.rangeLabel}
      </Line>
      <Line>
        <Key>Components</Key> {spell.componentsLabel}
      </Line>
      <Line>
        <Key>Duration</Key> {spell.durationLabel}
      </Line>
      <ValueLine label="Target" value={spell.targetLabel} />
      <ValueLine label="Area of Effect" value={spell.shapeLabel} />
      <ValueLine label="Saving Throw" value={spell.savingThrowLabel} />
      {spell.attackRoll && <Line>Requires a spell attack roll.</Line>}
      <ValueLine label="Damage" value={spell.damageRoll} />
      {spell.damageTypes.length > 0 && (
        <Line>
          <Key>Damage Type</Key> {spell.damageTypes.join(', ')}
        </Line>
      )}
      {spell.classes.length > 0 && (
        <Line>
          <Key>Classes</Key> {spell.classes.join(', ')}
        </Line>
      )}

      <Rule />

      <Desc>{spell.desc}</Desc>

      {spell.higherLevel && (
        <>
          <SectionTitle>At Higher Levels</SectionTitle>
          <Desc>{spell.higherLevel}</Desc>
        </>
      )}

      {spell.castingOptions.length > 0 && (
        <>
          <SectionTitle>Casting Options</SectionTitle>
          {spell.castingOptions.map(option => (
            <Entry key={option.id}>
              <EntryName>{option.label}.</EntryName>
              <CastingOptionDetail option={option} />
            </Entry>
          ))}
        </>
      )}
    </article>
  );
};

type CastingOptionDetailProps = {
  option: SpellDetail['castingOptions'][number];
};

/** Everything upstream supplies for a scaling slot — omitting whatever it left blank. */
const CastingOptionDetail = ({ option }: CastingOptionDetailProps) => (
  <>
    {option.desc && <EntryDesc>{option.desc}</EntryDesc>}
    {option.damageRoll && (
      <Line>
        <Key>Damage</Key> {option.damageRoll}
      </Line>
    )}
    {option.duration && (
      <Line>
        <Key>Duration</Key> {option.duration}
      </Line>
    )}
    {option.range && (
      <Line>
        <Key>Range</Key> {option.range}
      </Line>
    )}
    {option.targetCount != null && (
      <Line>
        <Key>Targets</Key> {option.targetCount}
      </Line>
    )}
    {option.shapeSize != null && (
      <Line>
        <Key>Size</Key> {option.shapeSize} ft.
      </Line>
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
    <Line>
      <Key>{label}</Key> {value}
    </Line>
  );
};

const Subtitle = styled.p`
  margin: 0 0 ${props => props.theme.space.sm};
  font-style: italic;
  color: ${props => props.theme.color.accent};
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

const Desc = styled.p`
  margin: 0;
  white-space: pre-line;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const SectionTitle = styled.h3`
  margin: ${props => props.theme.space.lg} 0 ${props => props.theme.space.sm};
  padding-bottom: ${props => props.theme.space.xs};
  border-bottom: 1px solid ${props => props.theme.color.accentMuted};
  font-size: ${props => props.theme.fontSize.md};
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

const EntryDesc = styled.p`
  margin: 0 0 ${props => props.theme.space.xs};
  white-space: pre-line;
  color: ${props => props.theme.color.textMuted};
`;

const Skeleton = styled.div`
  height: 20rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
