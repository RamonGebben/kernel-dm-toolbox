'use client';

import { TextInput } from '~/atoms/TextInput';
import { Stack } from '~/atoms/Stack';
import { Grid } from '~/molecules/CustomCreatureForm/components/Grid';
import { FieldLabel } from '~/atoms/FieldLabel';
import { SectionTitle } from '~/molecules/CustomCreatureForm/components/SectionTitle';
import { ABILITY_FIELDS } from '~/molecules/CustomCreatureForm/fields';
import type { CustomCreatureFormValues } from '~/molecules/CustomCreatureForm';

interface AbilityScoreFieldsProps {
  values: CustomCreatureFormValues;
  onChange: (patch: Partial<CustomCreatureFormValues>) => void;
}

/** The six ability scores, plus an optional saving-throw bonus for each. */
export const AbilityScoreFields = ({
  values,
  onChange,
}: AbilityScoreFieldsProps) => (
  <>
    <SectionTitle>Ability Scores</SectionTitle>
    <Grid $columns={6}>
      {ABILITY_FIELDS.map(([key, , , label]) => (
        <Stack $gap="xs" key={key}>
          <FieldLabel htmlFor={`custom-creature-ability-${key}`}>
            {label}
          </FieldLabel>
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
        </Stack>
      ))}
    </Grid>

    <SectionTitle>Saving Throws</SectionTitle>
    <Grid $columns={6}>
      {ABILITY_FIELDS.map(([key, , , label]) => (
        <Stack $gap="xs" key={key}>
          <FieldLabel htmlFor={`custom-creature-save-${key}`}>
            {label} Save
          </FieldLabel>
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
        </Stack>
      ))}
    </Grid>
  </>
);
