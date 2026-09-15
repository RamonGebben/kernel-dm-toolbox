'use client';

import styled from 'styled-components';
import { TextInput } from '~/atoms/TextInput';
import { Field, Label } from '~/molecules/CustomCreatureForm/styled';
import type { SpellSlotFormValues } from '~/molecules/PlayerCharacterCombatDataForm';

type SpellSlotRowsProps = {
  spellSlots: SpellSlotFormValues[];
  onChange: (spellSlots: SpellSlotFormValues[]) => void;
};

/**
 * A fixed nine rows, one per spell level — always shown regardless of
 * caster type, so a DM homebrewing an unusual PC can still grant a slot by
 * hand. A row saved at 0 is dropped on submit
 * (`toUpdateCombatDataInput`), not persisted as a zero-slot row.
 */
export const SpellSlotRows = ({ spellSlots, onChange }: SpellSlotRowsProps) => {
  const updateSlot = (spellLevel: number, maxSlots: string) =>
    onChange(
      spellSlots.map(slot =>
        slot.spellLevel === spellLevel ? { ...slot, maxSlots } : slot,
      ),
    );

  return (
    <Wrapper>
      {spellSlots.map(slot => (
        <Field key={slot.spellLevel}>
          <Label htmlFor={`player-character-spell-slot-${slot.spellLevel}`}>
            Lvl {slot.spellLevel}
          </Label>
          <TextInput
            id={`player-character-spell-slot-${slot.spellLevel}`}
            type="number"
            min={0}
            max={20}
            value={slot.maxSlots}
            onChange={event => updateSlot(slot.spellLevel, event.target.value)}
          />
        </Field>
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3.5rem, 1fr));
  gap: ${props => props.theme.space.sm};
`;
