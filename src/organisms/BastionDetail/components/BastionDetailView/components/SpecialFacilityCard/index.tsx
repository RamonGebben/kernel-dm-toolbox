'use client';

import { Button } from '~/atoms/Button';
import { Select } from '~/atoms/Select';
import { ConfirmButton } from '~/molecules/ConfirmButton';
import { bastionOrderLabels } from '~/content/bastion/orders';
import { specialFacilityEnlargeDays } from '~/content/bastion/basicFacilities';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import { formatGold } from '~/utils/applyGoldChange';
import { spaceLabel } from '~/utils/bastionRules';
import { Card } from '~/atoms/Card';
import { SpreadRow } from '~/atoms/SpreadRow';
import { Name } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Name';
import { MutedNote } from '~/atoms/MutedNote';
import { Holder } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Holder';
import { WarningNote } from '~/atoms/WarningNote';
import { VariantRow } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/VariantRow';
import { Orders } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Orders';
import { OptionLabel } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/OptionLabel';
import { MonoMuted } from '~/atoms/MonoMuted';
import { MutedParagraph } from '~/atoms/MutedParagraph';
import { Benefits } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Benefits';
import { Footer } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Footer';

type Facility = BastionDetail['specialFacilities'][number];

export interface SpecialFacilityCardProps {
  facility: Facility;
  /** In a party bastion, say which member holds it. */
  showHolder: boolean;
  treasuryGold: number;
  onSetVariant: (variant: string | null) => void;
  onEnlarge: () => void;
  onRemove: () => void;
}

/** "7 days · 10 gp", "7 days", "crafting rules" — whatever the option states. */
const describeTerms = (option: Facility['orderOptions'][number]): string =>
  [
    option.durationDays ? `${option.durationDays} days` : null,
    option.costGp ? formatGold(option.costGp) : null,
    option.minimumLevel ? `level ${option.minimumLevel}+` : null,
  ]
    .filter(Boolean)
    .join(' · ');

/** One special facility: what it is, what it can be ordered to do, and its upkeep. */
export const SpecialFacilityCard = ({
  facility,
  showHolder,
  treasuryGold,
  onSetVariant,
  onEnlarge,
  onRemove,
}: SpecialFacilityCardProps) => (
  <Card as="article" aria-label={facility.name}>
    <SpreadRow $align="flex-start">
      <div>
        <Name>{facility.name}</Name>
        <MutedNote>
          {spaceLabel(facility.space)} · {facility.hirelings} hireling
          {facility.hirelings === 1 ? '' : 's'} ·{' '}
          {bastionOrderLabels[facility.order]}
        </MutedNote>
        {showHolder ? (
          <Holder>Held by {facility.holder?.name ?? 'nobody'}</Holder>
        ) : null}
        {facility.job ? (
          <WarningNote>
            Working on {facility.job.label}
            {facility.job.note ? ` (${facility.job.note})` : ''},{' '}
            {facility.job.daysRemaining} days left
          </WarningNote>
        ) : null}
        {facility.isDuplicate ? (
          <WarningNote role="note">
            A second {facility.name}: a bastion keeps one of each, so remove
            one.
          </WarningNote>
        ) : null}
        {facility.isOutOfAction ? (
          <WarningNote>Out of action for the next bastion turn</WarningNote>
        ) : null}
      </div>
      <ConfirmButton
        label="Remove"
        ariaLabel={`Remove ${facility.name}`}
        confirmLabel={`Remove ${facility.name}`}
        onConfirm={onRemove}
      />
    </SpreadRow>

    {facility.variantOptions ? (
      <VariantRow>
        <label htmlFor={`variant-${facility.id}`}>
          {facility.variantOptions.label}
        </label>
        <Select
          id={`variant-${facility.id}`}
          value={facility.variant ?? ''}
          onChange={event => onSetVariant(event.target.value || null)}
        >
          <option value="">Not chosen</option>
          {facility.variantOptions.options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </VariantRow>
    ) : null}

    <Orders>
      {facility.orderOptions.map(option => (
        <li key={option.key}>
          <OptionLabel>{option.label}</OptionLabel>
          {describeTerms(option) ? (
            <MonoMuted> · {describeTerms(option)}</MonoMuted>
          ) : null}
          <MutedParagraph>{option.summary}</MutedParagraph>
        </li>
      ))}
    </Orders>

    {facility.benefits.length ? (
      <Benefits>
        {facility.benefits.map(benefit => (
          <li key={benefit}>{benefit}</li>
        ))}
      </Benefits>
    ) : null}

    <EnlargeRow
      facility={facility}
      treasuryGold={treasuryGold}
      onEnlarge={onEnlarge}
    />
  </Card>
);

type EnlargeRowProps = Pick<
  SpecialFacilityCardProps,
  'facility' | 'treasuryGold' | 'onEnlarge'
>;

const EnlargeRow = ({ facility, treasuryGold, onEnlarge }: EnlargeRowProps) => {
  if (facility.isBeingEnlarged)
    return <MutedNote>Being enlarged. See Construction.</MutedNote>;
  if (!facility.enlarge) return null;

  const canAfford = treasuryGold >= facility.enlarge.costGp;

  return (
    <Footer>
      <MutedNote>Once enlarged: {facility.enlarge.summary}</MutedNote>
      <Button
        variant="secondary"
        size="sm"
        disabled={!canAfford}
        title={canAfford ? undefined : 'The treasury cannot cover it'}
        onClick={onEnlarge}
      >
        Enlarge to Vast ({formatGold(facility.enlarge.costGp)},{' '}
        {specialFacilityEnlargeDays} days)
      </Button>
    </Footer>
  );
};
