'use client';

import { TextInput } from '~/atoms/TextInput';
import {
  Field,
  Grid,
  Label,
  Select,
} from '~/molecules/CustomCreatureForm/styled';
import type { CustomCreatureFormValues } from '~/molecules/CustomCreatureForm';
import { experienceByChallengeRating } from '~/content/challengeRating';
import { formatChallengeRating } from '~/utils/formatChallengeRating';

const CHALLENGE_RATING_OPTIONS = Object.keys(experienceByChallengeRating)
  .map(Number)
  .toSorted((left, right) => left - right)
  .map(value => ({ value, label: formatChallengeRating(value) }));

type IdentityFieldsProps = {
  values: CustomCreatureFormValues;
  onChange: (patch: Partial<CustomCreatureFormValues>) => void;
};

/** Name/size/type/alignment/CR plus AC, HP, hit dice and initiative bonus. */
export const IdentityFields = ({ values, onChange }: IdentityFieldsProps) => (
  <>
    <Field>
      <Label htmlFor="custom-creature-name">Name</Label>
      <TextInput
        id="custom-creature-name"
        value={values.name}
        required
        onChange={event => onChange({ name: event.target.value })}
      />
    </Field>

    <Grid $columns={4}>
      <Field>
        <Label htmlFor="custom-creature-size">Size</Label>
        <TextInput
          id="custom-creature-size"
          value={values.size}
          onChange={event => onChange({ size: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-type">Type</Label>
        <TextInput
          id="custom-creature-type"
          value={values.type}
          onChange={event => onChange({ type: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-alignment">Alignment</Label>
        <TextInput
          id="custom-creature-alignment"
          value={values.alignment}
          onChange={event => onChange({ alignment: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-cr">Challenge Rating</Label>
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
      </Field>
    </Grid>

    <Grid $columns={4}>
      <Field>
        <Label htmlFor="custom-creature-ac">AC</Label>
        <TextInput
          id="custom-creature-ac"
          type="number"
          min={0}
          value={values.armorClass}
          onChange={event =>
            onChange({ armorClass: Number(event.target.value) || 0 })
          }
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-armor-detail">Armor</Label>
        <TextInput
          id="custom-creature-armor-detail"
          value={values.armorDetail}
          placeholder="natural armor"
          onChange={event => onChange({ armorDetail: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-hp">HP</Label>
        <TextInput
          id="custom-creature-hp"
          type="number"
          min={1}
          value={values.hitPoints}
          onChange={event =>
            onChange({ hitPoints: Number(event.target.value) || 1 })
          }
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-hit-dice">Hit Dice</Label>
        <TextInput
          id="custom-creature-hit-dice"
          value={values.hitDice}
          placeholder="2d8 + 2"
          onChange={event => onChange({ hitDice: event.target.value })}
        />
      </Field>
    </Grid>

    <Field>
      <Label htmlFor="custom-creature-initiative">Initiative Bonus</Label>
      <TextInput
        id="custom-creature-initiative"
        type="number"
        value={values.initiativeBonus}
        placeholder="—"
        onChange={event => onChange({ initiativeBonus: event.target.value })}
      />
    </Field>
  </>
);
