'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { FieldRow } from '~/atoms/FieldRow';
import { Select } from '~/atoms/Select';
import { SectionHeading } from '~/atoms/SectionHeading';
import { ConfirmButton } from '~/molecules/ConfirmButton';
import {
  basicFacilityBuild,
  basicFacilityTypes,
  isBasicFacilityType,
  facilitySpaces,
} from '~/content/bastion/basicFacilities';
import type { BasicFacilityType, FacilitySpace } from '~/content/bastion/types';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import { formatGold } from '~/utils/applyGoldChange';
import { spaceLabel } from '~/utils/bastionRules';
import { Stack } from '~/atoms/Stack';
import { PlainList } from '~/atoms/PlainList';
import { Row } from '~/organisms/BastionDetail/components/BastionDetailView/components/Row';
import { Actions } from '~/organisms/BastionDetail/components/BastionDetailView/components/Actions';
import { MutedCaption } from '~/atoms/MutedCaption';
import { BuildForm } from '~/organisms/BastionDetail/components/BastionDetailView/components/BasicFacilitiesSection/components/BuildForm';

export interface BasicFacilitiesSectionProps {
  facilities: BastionDetail['basicFacilities'];
  treasuryGold: number;
  /** Paid from the treasury and built over days. */
  onBuild: (type: BasicFacilityType, space: FacilitySpace) => void;
  /** Already there — free and immediate. */
  onAddExisting: (type: BasicFacilityType, space: FacilitySpace) => void;
  onEnlarge: (facilityId: string) => void;
  onRemove: (facilityId: string) => void;
}

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
    <Stack as="section" $gap="s" aria-label="Basic facilities">
      <SectionHeading>Basic facilities</SectionHeading>

      <PlainList>
        {facilities.map(facility => (
          <Row key={facility.id}>
            <span>
              {facility.label}{' '}
              <MutedCaption>· {spaceLabel(facility.space)}</MutedCaption>
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
      </PlainList>

      <BuildForm>
        <FieldRow>
          <label htmlFor="basic-build-type">Room</label>
          <Select
            id="basic-build-type"
            value={type}
            onChange={event => {
              if (isBasicFacilityType(event.target.value))
                setType(event.target.value);
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
    </Stack>
  );
};

interface EnlargeButtonProps {
  facility: BastionDetail['basicFacilities'][number];
  treasuryGold: number;
  onEnlarge: () => void;
}

const EnlargeButton = ({
  facility,
  treasuryGold,
  onEnlarge,
}: EnlargeButtonProps) => {
  if (facility.isBeingEnlarged) return <MutedCaption>Enlarging…</MutedCaption>;
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
