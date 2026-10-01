'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { Select } from '~/atoms/FormControls';
import { ConfirmButton } from '~/molecules/ConfirmButton';
import { bastionOrderLabels } from '~/content/bastion/orders';
import { specialFacilityEnlargeDays } from '~/content/bastion/basicFacilities';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import { formatGold } from '~/utils/applyGoldChange';
import { spaceLabel } from '~/utils/bastionRules';

type Facility = BastionDetail['specialFacilities'][number];

export type SpecialFacilityCardProps = {
  facility: Facility;
  treasuryGold: number;
  onSetVariant: (variant: string | null) => void;
  onEnlarge: () => void;
  onRemove: () => void;
};

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
  treasuryGold,
  onSetVariant,
  onEnlarge,
  onRemove,
}: SpecialFacilityCardProps) => (
  <Card aria-label={facility.name}>
    <Header>
      <div>
        <Name>{facility.name}</Name>
        <Meta>
          {spaceLabel(facility.space)} · {facility.hirelings} hireling
          {facility.hirelings === 1 ? '' : 's'} ·{' '}
          {bastionOrderLabels[facility.order]}
        </Meta>
      </div>
      <ConfirmButton
        label="Remove"
        ariaLabel={`Remove ${facility.name}`}
        confirmLabel={`Remove ${facility.name}`}
        onConfirm={onRemove}
      />
    </Header>

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
            <Terms> · {describeTerms(option)}</Terms>
          ) : null}
          <Summary>{option.summary}</Summary>
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
    return <Note>Being enlarged — see Construction.</Note>;
  if (!facility.enlarge) return null;

  const canAfford = treasuryGold >= facility.enlarge.costGp;

  return (
    <Footer>
      <Note>{facility.enlarge.summary}</Note>
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

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const Name = styled.h4`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const Meta = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const VariantRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Orders = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${props => props.theme.fontSize.sm};
`;

const OptionLabel = styled.span`
  font-weight: 600;
  color: ${props => props.theme.color.textPrimary};
`;

const Terms = styled.span`
  font-family: ${props => props.theme.font.mono};
  color: ${props => props.theme.color.textMuted};
`;

const Summary = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textMuted};
`;

const Benefits = styled.ul`
  margin: 0;
  padding-left: ${props => props.theme.space.md};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const Note = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
