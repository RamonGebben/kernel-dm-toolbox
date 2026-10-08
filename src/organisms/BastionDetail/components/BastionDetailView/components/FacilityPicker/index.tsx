'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { CheckboxRow } from '~/atoms/CheckboxRow';
import { FieldRow } from '~/atoms/FieldRow';
import { Select } from '~/atoms/Select';
import { specialFacilities } from '~/content/bastion/specialFacilities';
import { bastionOrderLabels } from '~/content/bastion/orders';
import type { FacilityLevel } from '~/content/bastion/types';
import {
  allowanceForLevel,
  describeEligibilityProblem,
  findEligibilityProblems,
  spaceLabel,
} from '~/utils/bastionRules';
import { Stack } from '~/atoms/Stack';
import { MutedParagraph } from '~/atoms/MutedParagraph';
import { LevelHeading } from '~/organisms/BastionDetail/components/BastionDetailView/components/FacilityPicker/components/LevelHeading';
import { PlainList } from '~/atoms/PlainList';
import { Row } from '~/organisms/BastionDetail/components/BastionDetailView/components/FacilityPicker/components/Row';
import { Shrink } from '~/atoms/Shrink';
import { Paragraph } from '~/atoms/Paragraph';
import { MutedNote } from '~/atoms/MutedNote';
import { WarningNote } from '~/atoms/WarningNote';

export interface PickerMember {
  id: string;
  name: string;
  level: number;
  className: string | null;
  /** Catalog keys this member already holds here. */
  heldKeys: ReadonlyArray<string>;
}

export interface FacilityPickerProps {
  /**
   * Who can take a facility: the owner alone in their own bastion, every
   * member in the party's — each checked against their own allowance.
   */
  members: ReadonlyArray<PickerMember>;
  /**
   * Every facility already in the bastion, whoever holds it — each type is
   * there once for everyone (bar the four that may repeat).
   */
  bastionKeys: ReadonlyArray<string>;
  isSaving: boolean;
  onAdd: (
    facilityKey: string,
    ignoreRequirements: boolean,
    holderCharacterId: string,
  ) => void;
}

const levels: ReadonlyArray<FacilityLevel> = [5, 9, 13, 17];

/**
 * The catalog, checked against the member taking it: what they can take now,
 * and — for anything they cannot — why. The rules are the default; "ignore
 * the rules" is a deliberate DM override (DECISIONS #33).
 */
export const FacilityPicker = ({
  members,
  bastionKeys,
  isSaving,
  onAdd,
}: FacilityPickerProps) => {
  const [ignoreRules, setIgnoreRules] = useState(false);
  // Start on someone who can still take a facility, not on a member who is
  // too low a level or already full.
  const [holderId, setHolderId] = useState(
    (
      members.find(
        member => member.heldKeys.length < allowanceForLevel(member.level),
      ) ?? members[0]
    )?.id ?? '',
  );
  const owner = members.find(({ id }) => id === holderId) ?? members[0];

  if (!owner)
    return (
      <MutedParagraph>Nobody can hold a facility here yet.</MutedParagraph>
    );

  const { heldKeys } = owner;

  return (
    <Stack>
      {members.length > 1 ? (
        <FieldRow>
          <label htmlFor="facility-picker-holder">For</label>
          <Select
            id="facility-picker-holder"
            value={owner.id}
            onChange={event => setHolderId(event.target.value)}
          >
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} (level {member.level})
              </option>
            ))}
          </Select>
        </FieldRow>
      ) : null}
      <MutedParagraph>
        {owner.name} is level {owner.level}
        {owner.className ? ` (${owner.className})` : ''}. Facilities they cannot
        take yet say why.
      </MutedParagraph>
      <CheckboxRow>
        <input
          id="facility-picker-ignore-rules"
          type="checkbox"
          checked={ignoreRules}
          onChange={event => setIgnoreRules(event.target.checked)}
        />
        <label htmlFor="facility-picker-ignore-rules">
          Ignore the rules (DM override)
        </label>
      </CheckboxRow>

      {levels.map(level => (
        <Stack
          as="section"
          $gap="xs"
          key={level}
          aria-label={`Level ${level} facilities`}
        >
          <LevelHeading>Level {level}</LevelHeading>
          <PlainList>
            {specialFacilities
              .filter(facility => facility.level === level)
              .map(facility => {
                const problems = findEligibilityProblems(facility, owner, {
                  byOwner: heldKeys,
                  inBastion: bastionKeys,
                });

                return (
                  <Row key={facility.key}>
                    <Shrink>
                      <Paragraph>{facility.name}</Paragraph>
                      <MutedNote>
                        {spaceLabel(facility.space)} ·{' '}
                        {bastionOrderLabels[facility.order]}
                        {facility.allowMultiple ? ' · can take several' : ''}
                      </MutedNote>
                      {problems.map(problem => (
                        <WarningNote key={problem.kind}>
                          {describeEligibilityProblem(problem)}
                        </WarningNote>
                      ))}
                    </Shrink>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Add ${facility.name}`}
                      disabled={
                        isSaving || (problems.length > 0 && !ignoreRules)
                      }
                      onClick={() =>
                        onAdd(facility.key, problems.length > 0, owner.id)
                      }
                    >
                      Add
                    </Button>
                  </Row>
                );
              })}
          </PlainList>
        </Stack>
      ))}
    </Stack>
  );
};
