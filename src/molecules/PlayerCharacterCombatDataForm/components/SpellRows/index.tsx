'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import {
  Field,
  Grid,
  Label,
  Select,
} from '~/molecules/CustomCreatureForm/styled';
import type {
  SpellFormValues,
  SpellOption,
} from '~/molecules/PlayerCharacterCombatDataForm';

type SpellRowsProps = {
  spells: SpellFormValues[];
  availableSpells: readonly SpellOption[];
  onChange: (spells: SpellFormValues[]) => void;
};

/**
 * Repeatable spell rows: pick one from the class's known spell list (once —
 * an already-added spell drops out of the picker), then toggle prepared and
 * always-available (cantrip) per row.
 */
export const SpellRows = ({
  spells,
  availableSpells,
  onChange,
}: SpellRowsProps) => {
  const addedSlugs = new Set(spells.map(spell => spell.spellSlug));
  const remaining = availableSpells.filter(
    option => !addedSlugs.has(option.slug),
  );

  const updateSpell = (index: number, patch: Partial<SpellFormValues>) =>
    onChange(
      spells.map((spell, current) =>
        current === index ? { ...spell, ...patch } : spell,
      ),
    );

  const removeSpell = (index: number) =>
    onChange(spells.filter((_spell, current) => current !== index));

  const addSpell = (option: SpellOption) =>
    onChange([
      ...spells,
      {
        spellSlug: option.slug,
        name: option.name,
        isPrepared: true,
        isAlwaysAvailable: false,
      },
    ]);

  return (
    <RowsWrapper>
      {spells.map((spell, index) => (
        <Row key={spell.spellSlug}>
          <SpellName>{spell.name}</SpellName>
          <ToggleLabel>
            <input
              type="checkbox"
              checked={spell.isPrepared}
              onChange={event =>
                updateSpell(index, { isPrepared: event.target.checked })
              }
            />
            Prepared
          </ToggleLabel>
          <ToggleLabel>
            <input
              type="checkbox"
              checked={spell.isAlwaysAvailable}
              onChange={event =>
                updateSpell(index, { isAlwaysAvailable: event.target.checked })
              }
            />
            Always available (cantrip)
          </ToggleLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeSpell(index)}
          >
            Remove
          </Button>
        </Row>
      ))}

      {remaining.length > 0 && (
        <Grid $columns={2}>
          <Field>
            <Label htmlFor="player-character-add-spell">Add a spell</Label>
            <Select
              id="player-character-add-spell"
              value=""
              onChange={event => {
                const option = remaining.find(
                  candidate => candidate.slug === event.target.value,
                );
                if (option) addSpell(option);
              }}
            >
              <option value="" disabled>
                Choose a spell…
              </option>
              {remaining.map(option => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
        </Grid>
      )}
    </RowsWrapper>
  );
};

const RowsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const SpellName = styled.span`
  flex: 1;
  min-width: 8rem;
  font-size: ${props => props.theme.fontSize.md};
  color: ${props => props.theme.color.textPrimary};
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
