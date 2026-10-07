'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { Select } from '~/atoms/FormControls';
import {
  basicFacilityTypes,
  isBasicFacilityType,
} from '~/content/bastion/basicFacilities';
import type { BasicFacilityType } from '~/content/bastion/types';

export type PendingFreeRoomsProps = {
  members: readonly { id: string; name: string }[];
  onAdd: (rooms: {
    characterId: string;
    crampedBasicType: BasicFacilityType;
    roomyBasicType: BasicFacilityType;
  }) => void;
};

/**
 * Party members who reached level 5 after the party bastion was founded:
 * each brings their own two free rooms, picked here.
 */
export const PendingFreeRooms = ({ members, onAdd }: PendingFreeRoomsProps) => {
  if (!members.length) return null;

  return (
    <Wrapper aria-label="Free rooms to add">
      {members.map(member => (
        <MemberPrompt key={member.id} member={member} onAdd={onAdd} />
      ))}
    </Wrapper>
  );
};

type MemberPromptProps = {
  member: { id: string; name: string };
  onAdd: PendingFreeRoomsProps['onAdd'];
};

const MemberPrompt = ({ member, onAdd }: MemberPromptProps) => {
  const [cramped, setCramped] = useState<BasicFacilityType>('bedroom');
  const [roomy, setRoomy] = useState<BasicFacilityType>('kitchen');

  return (
    <Prompt>
      <Text>{member.name} has reached level 5 and brings two free rooms:</Text>
      <Select
        aria-label={`${member.name}'s free Cramped room`}
        value={cramped}
        onChange={event => {
          if (isBasicFacilityType(event.target.value))
            setCramped(event.target.value);
        }}
      >
        {basicFacilityTypes.map(({ type, label }) => (
          <option key={type} value={type}>
            Cramped {label}
          </option>
        ))}
      </Select>
      <Select
        aria-label={`${member.name}'s free Roomy room`}
        value={roomy}
        onChange={event => {
          if (isBasicFacilityType(event.target.value))
            setRoomy(event.target.value);
        }}
      >
        {basicFacilityTypes.map(({ type, label }) => (
          <option key={type} value={type}>
            Roomy {label}
          </option>
        ))}
      </Select>
      <Button
        size="sm"
        onClick={() =>
          onAdd({
            characterId: member.id,
            crampedBasicType: cramped,
            roomyBasicType: roomy,
          })
        }
      >
        Add {member.name}&apos;s rooms
      </Button>
    </Prompt>
  );
};

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const Prompt = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  border: 1px solid ${props => props.theme.color.accent};
  border-radius: ${props => props.theme.radius.sm};
`;

const Text = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
`;
