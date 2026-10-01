'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { CheckboxRow, FieldRow, Select } from '~/atoms/FormControls';
import { specialFacilities } from '~/content/bastion/specialFacilities';
import { bastionOrderLabels } from '~/content/bastion/orders';
import type { FacilityLevel } from '~/content/bastion/types';
import {
  allowanceForLevel,
  describeEligibilityProblem,
  findEligibilityProblems,
  spaceLabel,
} from '~/utils/bastionRules';

export type PickerMember = {
  id: string;
  name: string;
  level: number;
  className: string | null;
  /** Catalog keys this member already holds here. */
  heldKeys: readonly string[];
};

export type FacilityPickerProps = {
  /**
   * Who can take a facility: the owner alone in their own bastion, every
   * member in the party's — each checked against their own allowance.
   */
  members: readonly PickerMember[];
  isSaving: boolean;
  onAdd: (
    facilityKey: string,
    ignoreRequirements: boolean,
    holderCharacterId: string,
  ) => void;
};

const levels: readonly FacilityLevel[] = [5, 9, 13, 17];

/**
 * The catalog, checked against the member taking it: what they can take now,
 * and — for anything they cannot — why. The rules are the default; "ignore
 * the rules" is a deliberate DM override (DECISIONS #33).
 */
export const FacilityPicker = ({
  members,
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

  if (!owner) return <Intro>Nobody can hold a facility here yet.</Intro>;

  const { heldKeys } = owner;

  return (
    <Wrapper>
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
      <Intro>
        {owner.name} is level {owner.level}
        {owner.className ? ` (${owner.className})` : ''}. Facilities they cannot
        take yet say why.
      </Intro>
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
        <Group key={level} aria-label={`Level ${level} facilities`}>
          <LevelHeading>Level {level}</LevelHeading>
          <List>
            {specialFacilities
              .filter(facility => facility.level === level)
              .map(facility => {
                const problems = findEligibilityProblems(
                  facility,
                  owner,
                  heldKeys,
                );

                return (
                  <Row key={facility.key}>
                    <Details>
                      <Name>{facility.name}</Name>
                      <Meta>
                        {spaceLabel(facility.space)} ·{' '}
                        {bastionOrderLabels[facility.order]}
                        {facility.allowMultiple ? ' · can take several' : ''}
                      </Meta>
                      {problems.map(problem => (
                        <Problem key={problem.kind}>
                          {describeEligibilityProblem(problem)}
                        </Problem>
                      ))}
                    </Details>
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
          </List>
        </Group>
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const Intro = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textMuted};
`;

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const LevelHeading = styled.h4`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Details = styled.div`
  min-width: 0;
`;

const Name = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
`;

const Meta = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Problem = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.warning};
`;
