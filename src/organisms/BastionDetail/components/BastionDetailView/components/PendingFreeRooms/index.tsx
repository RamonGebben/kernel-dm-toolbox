'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { Select } from '~/atoms/Select';
import {
  basicFacilityTypes,
  isBasicFacilityType,
} from '~/content/bastion/basicFacilities';
import type { BasicFacilityType } from '~/content/bastion/types';
import { Stack } from '~/atoms/Stack';
import { Prompt } from '~/organisms/BastionDetail/components/BastionDetailView/components/PendingFreeRooms/components/Prompt';
import { Paragraph } from '~/atoms/Paragraph';

export interface PendingFreeRoomsProps {
  members: ReadonlyArray<{ id: string; name: string }>;
  onAdd: (rooms: {
    characterId: string;
    crampedBasicType: BasicFacilityType;
    roomyBasicType: BasicFacilityType;
  }) => void;
}

/**
 * Party members who reached level 5 after the party bastion was founded:
 * each brings their own two free rooms, picked here.
 */
export const PendingFreeRooms = ({ members, onAdd }: PendingFreeRoomsProps) => {
  if (!members.length) return null;

  return (
    <Stack as="section" $gap="xs" aria-label="Free rooms to add">
      {members.map(member => (
        <MemberPrompt key={member.id} member={member} onAdd={onAdd} />
      ))}
    </Stack>
  );
};

interface MemberPromptProps {
  member: { id: string; name: string };
  onAdd: PendingFreeRoomsProps['onAdd'];
}

const MemberPrompt = ({ member, onAdd }: MemberPromptProps) => {
  const [cramped, setCramped] = useState<BasicFacilityType>('bedroom');
  const [roomy, setRoomy] = useState<BasicFacilityType>('kitchen');

  return (
    <Prompt>
      <Paragraph>
        {member.name} has reached level 5 and brings two free rooms:
      </Paragraph>
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
