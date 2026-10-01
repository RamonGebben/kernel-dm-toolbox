'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { FieldRow, Select } from '~/atoms/FormControls';
import { SectionHeading } from '~/atoms/SectionHeading';
import { ConfirmButton } from '~/molecules/ConfirmButton';
import {
  basicFacilityBuild,
  basicFacilityTypes,
  facilitySpaces,
} from '~/content/bastion/basicFacilities';
import type { BasicFacilityType, FacilitySpace } from '~/content/bastion/types';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import { formatGold } from '~/utils/applyGoldChange';
import { spaceLabel } from '~/utils/bastionRules';

export type BasicFacilitiesSectionProps = {
  facilities: BastionDetail['basicFacilities'];
  treasuryGold: number;
  /** Paid from the treasury and built over days. */
  onBuild: (type: BasicFacilityType, space: FacilitySpace) => void;
  /** Already there — free and immediate. */
  onAddExisting: (type: BasicFacilityType, space: FacilitySpace) => void;
  onEnlarge: (facilityId: string) => void;
  onRemove: (facilityId: string) => void;
};

const isBasicType = (value: string): value is BasicFacilityType =>
  basicFacilityTypes.some(({ type }) => type === value);

const isSpace = (value: string): value is FacilitySpace =>
  facilitySpaces.some(({ space }) => space === value);

/** The flavour rooms: no mechanics, but they cost gold and time to build. */
export const BasicFacilitiesSection = ({
  facilities,
  treasuryGold,
  onBuild,
  onAddExisting,
  onEnlarge,
  onRemove,
}: BasicFacilitiesSectionProps) => {
  const [type, setType] = useState<BasicFacilityType>('bedroom');
  const [space, setSpace] = useState<FacilitySpace>('cramped');
  const build = basicFacilityBuild[space];

  return (
    <Section aria-label="Basic facilities">
      <SectionHeading>Basic facilities</SectionHeading>

      <List>
        {facilities.map(facility => (
          <Row key={facility.id}>
            <span>
              {facility.label} <Muted>· {spaceLabel(facility.space)}</Muted>
            </span>
            <Actions>
              <EnlargeButton
                facility={facility}
                treasuryGold={treasuryGold}
                onEnlarge={() => onEnlarge(facility.id)}
              />
              <ConfirmButton
                label="Remove"
                ariaLabel={`Remove ${facility.label}`}
                confirmLabel={`Remove ${facility.label}`}
                onConfirm={() => onRemove(facility.id)}
              />
            </Actions>
          </Row>
        ))}
      </List>

      <BuildForm>
        <FieldRow>
          <label htmlFor="basic-build-type">Room</label>
          <Select
            id="basic-build-type"
            value={type}
            onChange={event => {
              if (isBasicType(event.target.value)) setType(event.target.value);
            }}
          >
            {basicFacilityTypes.map(entry => (
              <option key={entry.type} value={entry.type}>
                {entry.label}
              </option>
            ))}
          </Select>
        </FieldRow>
        <FieldRow>
          <label htmlFor="basic-build-space">Size</label>
          <Select
            id="basic-build-space"
            value={space}
            onChange={event => {
              if (isSpace(event.target.value)) setSpace(event.target.value);
            }}
          >
            {facilitySpaces.map(entry => (
              <option key={entry.space} value={entry.space}>
                {entry.label} ({entry.squares} squares)
              </option>
            ))}
          </Select>
        </FieldRow>
        <Button
          size="sm"
          disabled={treasuryGold < build.costGp}
          onClick={() => onBuild(type, space)}
        >
          Build ({formatGold(build.costGp)}, {build.days} days)
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddExisting(type, space)}
        >
          Add as already built
        </Button>
      </BuildForm>
    </Section>
  );
};

type EnlargeButtonProps = {
  facility: BastionDetail['basicFacilities'][number];
  treasuryGold: number;
  onEnlarge: () => void;
};

const EnlargeButton = ({
  facility,
  treasuryGold,
  onEnlarge,
}: EnlargeButtonProps) => {
  if (facility.isBeingEnlarged) return <Muted>Enlarging…</Muted>;
  if (!facility.enlarge) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Enlarge ${facility.label} to ${spaceLabel(facility.enlarge.to)}`}
      disabled={treasuryGold < facility.enlarge.costGp}
      onClick={onEnlarge}
    >
      Enlarge to {spaceLabel(facility.enlarge.to)} (
      {formatGold(facility.enlarge.costGp)}, {facility.enlarge.days} days)
    </Button>
  );
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
`;

const Muted = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const BuildForm = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${props => props.theme.space.sm};
`;
