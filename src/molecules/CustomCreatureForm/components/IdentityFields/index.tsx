'use client';

import { TextInput } from '~/atoms/TextInput';
import { Stack } from '~/atoms/Stack';
import { Grid } from '~/molecules/CustomCreatureForm/components/Grid';
import { FieldLabel } from '~/atoms/FieldLabel';
import { Select } from '~/molecules/CustomCreatureForm/components/Select';
import type { CustomCreatureFormValues } from '~/molecules/CustomCreatureForm';
import { experienceByChallengeRating } from '~/content/challengeRating';
import { formatChallengeRating } from '~/utils/formatChallengeRating';

const CHALLENGE_RATING_OPTIONS = Object.keys(experienceByChallengeRating)
  .map(Number)
  .toSorted((left, right) => left - right)
  .map(value => ({ value, label: formatChallengeRating(value) }));

interface IdentityFieldsProps {
  values: CustomCreatureFormValues;
  onChange: (patch: Partial<CustomCreatureFormValues>) => void;
}

/** Name/size/type/alignment/CR plus AC, HP, hit dice and initiative bonus. */
export const IdentityFields = ({ values, onChange }: IdentityFieldsProps) => (
  <>
    <Stack $gap="xs">
      <FieldLabel htmlFor="custom-creature-name">Name</FieldLabel>
      <TextInput
        id="custom-creature-name"
        value={values.name}
        required
        onChange={event => onChange({ name: event.target.value })}
      />
    </Stack>

    <Grid $columns={4}>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-size">Size</FieldLabel>
        <TextInput
          id="custom-creature-size"
          value={values.size}
          onChange={event => onChange({ size: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-type">Type</FieldLabel>
        <TextInput
          id="custom-creature-type"
          value={values.type}
          onChange={event => onChange({ type: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-alignment">Alignment</FieldLabel>
        <TextInput
          id="custom-creature-alignment"
          value={values.alignment}
          onChange={event => onChange({ alignment: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-cr">Challenge Rating</FieldLabel>
        <Select
          id="custom-creature-cr"
          value={values.challengeRating}
          onChange={event =>
            onChange({ challengeRating: Number(event.target.value) })
          }
        >
          {CHALLENGE_RATING_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Stack>
    </Grid>

    <Grid $columns={4}>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-ac">AC</FieldLabel>
        <TextInput
          id="custom-creature-ac"
          type="number"
          min={0}
          value={values.armorClass}
          onChange={event =>
            onChange({ armorClass: Number(event.target.value) || 0 })
          }
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-armor-detail">Armor</FieldLabel>
        <TextInput
          id="custom-creature-armor-detail"
          value={values.armorDetail}
          placeholder="natural armor"
          onChange={event => onChange({ armorDetail: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-hp">HP</FieldLabel>
        <TextInput
          id="custom-creature-hp"
          type="number"
          min={1}
          value={values.hitPoints}
          onChange={event =>
            onChange({ hitPoints: Number(event.target.value) || 1 })
          }
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-hit-dice">Hit Dice</FieldLabel>
        <TextInput
          id="custom-creature-hit-dice"
          value={values.hitDice}
          placeholder="2d8 + 2"
          onChange={event => onChange({ hitDice: event.target.value })}
        />
      </Stack>
    </Grid>

    <Stack $gap="xs">
      <FieldLabel htmlFor="custom-creature-initiative">
        Initiative Bonus
      </FieldLabel>
      <TextInput
        id="custom-creature-initiative"
        type="number"
        value={values.initiativeBonus}
        placeholder="—"
        onChange={event => onChange({ initiativeBonus: event.target.value })}
      />
    </Stack>
  </>
);
