'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { FieldRow, Select } from '~/atoms/FormControls';
import { basicFacilityTypes } from '~/content/bastion/basicFacilities';
import type { BasicFacilityType } from '~/content/bastion/types';
import type { FoundableCharacter } from '~/utils/bastionSelection';

export type FoundBastionValues = {
  ownerCharacterId: string;
  name: string;
  crampedBasicType: BasicFacilityType;
  roomyBasicType: BasicFacilityType;
};

export type FoundBastionFormProps = {
  characters: readonly FoundableCharacter[];
  isSaving: boolean;
  error: string | null;
  onSubmit: (values: FoundBastionValues) => void;
  onCancel: () => void;
};

const isBasicType = (value: string): value is BasicFacilityType =>
  basicFacilityTypes.some(({ type }) => type === value);

/**
 * Founding a bastion: the owner, a name, and the two free basic facilities
 * every bastion starts with — one Cramped, one Roomy.
 */
export const FoundBastionForm = ({
  characters,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: FoundBastionFormProps) => {
  const eligible = characters.filter(character => character.canFound);
  const tooLow = characters.filter(character => !character.canFound);

  const [values, setValues] = useState<FoundBastionValues>({
    ownerCharacterId: eligible[0]?.id ?? '',
    name: '',
    crampedBasicType: 'bedroom',
    roomyBasicType: 'kitchen',
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!values.ownerCharacterId) return;
    onSubmit(values);
  };

  if (!eligible.length) {
    return (
      <Message>
        Nobody can found a bastion right now. A character needs to be level 5 or
        higher, active, and not already own one.
      </Message>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <FieldRow>
        <label htmlFor="bastion-owner">Owner</label>
        <Select
          id="bastion-owner"
          value={values.ownerCharacterId}
          onChange={event =>
            setValues(current => ({
              ...current,
              ownerCharacterId: event.target.value,
            }))
          }
        >
          {eligible.map(character => (
            <option key={character.id} value={character.id}>
              {character.name} (level {character.level})
            </option>
          ))}
        </Select>
      </FieldRow>

      <FieldRow>
        <label htmlFor="bastion-name">Name</label>
        <TextInput
          id="bastion-name"
          required
          value={values.name}
          onChange={event =>
            setValues(current => ({ ...current, name: event.target.value }))
          }
        />
      </FieldRow>

      <Grid>
        <FieldRow>
          <label htmlFor="bastion-cramped">Free Cramped room</label>
          <Select
            id="bastion-cramped"
            value={values.crampedBasicType}
            onChange={event => {
              const { value } = event.target;
              if (isBasicType(value))
                setValues(current => ({ ...current, crampedBasicType: value }));
            }}
          >
            {basicFacilityTypes.map(({ type, label }) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </Select>
        </FieldRow>
        <FieldRow>
          <label htmlFor="bastion-roomy">Free Roomy room</label>
          <Select
            id="bastion-roomy"
            value={values.roomyBasicType}
            onChange={event => {
              const { value } = event.target;
              if (isBasicType(value))
                setValues(current => ({ ...current, roomyBasicType: value }));
            }}
          >
            {basicFacilityTypes.map(({ type, label }) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </Select>
        </FieldRow>
      </Grid>

      {tooLow.length ? (
        <Hint>
          Not yet level 5: {tooLow.map(character => character.name).join(', ')}.
        </Hint>
      ) : null}
      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      <Actions>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Founding…' : 'Found bastion'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </Actions>
    </Form>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${props => props.theme.space.sm};
`;

const Hint = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Message = styled(Hint)`
  font-size: ${props => props.theme.fontSize.md};
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.danger};
`;

const Actions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;
