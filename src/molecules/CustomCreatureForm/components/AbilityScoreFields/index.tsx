'use client';

import { TextInput } from '~/atoms/TextInput';
import {
  Field,
  Grid,
  Label,
  SectionTitle,
} from '~/molecules/CustomCreatureForm/styled';
import { ABILITY_FIELDS } from '~/molecules/CustomCreatureForm/fields';
import type { CustomCreatureFormValues } from '~/molecules/CustomCreatureForm';

type AbilityScoreFieldsProps = {
  values: CustomCreatureFormValues;
  onChange: (patch: Partial<CustomCreatureFormValues>) => void;
};

/** The six ability scores, plus an optional saving-throw bonus for each. */
export const AbilityScoreFields = ({
  values,
  onChange,
}: AbilityScoreFieldsProps) => (
  <>
    <SectionTitle>Ability Scores</SectionTitle>
    <Grid $columns={6}>
      {ABILITY_FIELDS.map(([key, , , label]) => (
        <Field key={key}>
          <Label htmlFor={`custom-creature-ability-${key}`}>{label}</Label>
          <TextInput
            id={`custom-creature-ability-${key}`}
            type="number"
            min={1}
            max={30}
            value={values.abilityScores[key]}
            onChange={event =>
              onChange({
                abilityScores: {
                  ...values.abilityScores,
                  [key]: Number(event.target.value) || 10,
                },
              })
            }
          />
        </Field>
      ))}
    </Grid>

    <SectionTitle>Saving Throws</SectionTitle>
    <Grid $columns={6}>
      {ABILITY_FIELDS.map(([key, , , label]) => (
        <Field key={key}>
          <Label htmlFor={`custom-creature-save-${key}`}>{label} Save</Label>
          <TextInput
            id={`custom-creature-save-${key}`}
            type="number"
            value={values.savingThrows[key]}
            placeholder="—"
            onChange={event =>
              onChange({
                savingThrows: {
                  ...values.savingThrows,
                  [key]: event.target.value,
                },
              })
            }
          />
        </Field>
      ))}
    </Grid>
  </>
);
