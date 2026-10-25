'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { FieldRow } from '~/atoms/FieldRow';
import { Select } from '~/atoms/Select';
import {
  basicFacilityTypes,
  isBasicFacilityType,
} from '~/content/bastion/basicFacilities';
import type { BasicFacilityType } from '~/content/bastion/types';
import type { BastionMode } from '~/server/db/schema';
import type { FoundableCharacter } from '~/utils/bastionSelection';
import { Stack } from '~/atoms/Stack';
import { MemberRooms } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm/components/MemberRooms';
import { MemberName } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm/components/MemberName';
import { Grid } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm/components/Grid';
import { MutedNote } from '~/atoms/MutedNote';
import { Message } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm/components/Message';
import { ErrorNote } from '~/atoms/ErrorNote';
import { Cluster } from '~/atoms/Cluster';

interface FreeRooms {
  crampedBasicType: BasicFacilityType;
  roomyBasicType: BasicFacilityType;
}

export type FoundBastionValues =
  | ({
      mode: 'per-character';
      ownerCharacterId: string;
      name: string;
    } & FreeRooms)
  | {
      mode: 'party';
      name: string;
      members: Array<{ characterId: string } & FreeRooms>;
    };

export interface FoundBastionFormProps {
  mode: BastionMode;
  characters: ReadonlyArray<FoundableCharacter>;
  isSaving: boolean;
  error: string | null;
  onSubmit: (values: FoundBastionValues) => void;
  onCancel: () => void;
}

const defaultRooms: FreeRooms = {
  crampedBasicType: 'bedroom',
  roomyBasicType: 'kitchen',
};

/**
 * Founding a bastion. Per character: an owner, a name and their two free
 * rooms. For the party: a name, and every level 5+ member brings their own
 * two free rooms — which is what makes the shared bastion bigger.
 */
export const FoundBastionForm = ({
  mode,
  characters,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: FoundBastionFormProps) => {
  const eligible = characters.filter(character => character.canFound);
  const tooLow = characters.filter(character => !character.canFound);

  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState(eligible[0]?.id ?? '');
  const [rooms, setRooms] = useState<Record<string, FreeRooms>>({});
  const roomsFor = (id: string) => rooms[id] ?? defaultRooms;

  const setRoom = (id: string, key: keyof FreeRooms, value: string) => {
    if (!isBasicFacilityType(value)) return;
    setRooms(current => ({
      ...current,
      [id]: { ...(current[id] ?? defaultRooms), [key]: value },
    }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (mode === 'party') {
      onSubmit({
        mode,
        name,
        members: eligible.map(({ id }) => ({
          characterId: id,
          ...roomsFor(id),
        })),
      });
      return;
    }

    if (!ownerId) return;
    onSubmit({ mode, ownerCharacterId: ownerId, name, ...roomsFor(ownerId) });
  };

  if (!eligible.length) {
    return (
      <Message>
        {mode === 'party'
          ? 'Nobody in the party is level 5 yet. A bastion needs at least one member who is.'
          : 'Nobody can found a bastion right now. A character needs to be level 5 or higher, active, and not already own one.'}
      </Message>
    );
  }

  const roomPickers =
    mode === 'party' ? eligible : eligible.filter(({ id }) => id === ownerId);

  return (
    <Stack as="form" $gap="s" onSubmit={submit}>
      {mode === 'per-character' ? (
        <FieldRow>
          <label htmlFor="bastion-owner">Owner</label>
          <Select
            id="bastion-owner"
            value={ownerId}
            onChange={event => setOwnerId(event.target.value)}
          >
            {eligible.map(character => (
              <option key={character.id} value={character.id}>
                {character.name} (level {character.level})
              </option>
            ))}
          </Select>
        </FieldRow>
      ) : (
        <MutedNote>
          The whole party shares this bastion. Each member below brings two free
          rooms and picks their own special facilities.
        </MutedNote>
      )}

      <FieldRow>
        <label htmlFor="bastion-name">Name</label>
        <TextInput
          id="bastion-name"
          required
          value={name}
          onChange={event => setName(event.target.value)}
        />
      </FieldRow>

      {roomPickers.map(character => (
        <MemberRooms
          key={character.id}
          aria-label={`${character.name}'s free rooms`}
        >
          {mode === 'party' ? <MemberName>{character.name}</MemberName> : null}
          <Grid>
            <FieldRow>
              <label htmlFor={`cramped-${character.id}`}>
                Free Cramped room
              </label>
              <Select
                id={`cramped-${character.id}`}
                value={roomsFor(character.id).crampedBasicType}
                onChange={event =>
                  setRoom(character.id, 'crampedBasicType', event.target.value)
                }
              >
                {basicFacilityTypes.map(({ type, label }) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </Select>
            </FieldRow>
            <FieldRow>
              <label htmlFor={`roomy-${character.id}`}>Free Roomy room</label>
              <Select
                id={`roomy-${character.id}`}
                value={roomsFor(character.id).roomyBasicType}
                onChange={event =>
                  setRoom(character.id, 'roomyBasicType', event.target.value)
                }
              >
                {basicFacilityTypes.map(({ type, label }) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </Select>
            </FieldRow>
          </Grid>
        </MemberRooms>
      ))}

      {tooLow.length ? (
        <MutedNote>
          Not yet level 5: {tooLow.map(character => character.name).join(', ')}.
          {mode === 'party'
            ? ' They bring their rooms once they get there.'
            : ''}
        </MutedNote>
      ) : null}
      {error ? <ErrorNote role="alert">{error}</ErrorNote> : null}

      <Cluster>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Founding…' : 'Found bastion'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </Cluster>
    </Stack>
  );
};
