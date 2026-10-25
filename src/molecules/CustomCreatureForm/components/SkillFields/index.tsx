'use client';

import { TextInput } from '~/atoms/TextInput';
import { Stack } from '~/atoms/Stack';
import { Grid } from '~/molecules/CustomCreatureForm/components/Grid';
import { FieldLabel } from '~/atoms/FieldLabel';
import { SectionTitle } from '~/molecules/CustomCreatureForm/components/SectionTitle';
import { SKILL_FIELDS } from '~/molecules/CustomCreatureForm/fields';
import type { CustomCreatureFormValues } from '~/molecules/CustomCreatureForm';

interface SkillFieldsProps {
  values: CustomCreatureFormValues;
  onChange: (patch: Partial<CustomCreatureFormValues>) => void;
}

/** All eighteen skills, blank meaning "not proficient" — same as the library. */
export const SkillFields = ({ values, onChange }: SkillFieldsProps) => (
  <>
    <SectionTitle>Skills</SectionTitle>
    <Grid $columns={3}>
      {SKILL_FIELDS.map(([key, , label]) => (
        <Stack $gap="xs" key={key}>
          <FieldLabel htmlFor={`custom-creature-skill-${key}`}>
            {label}
          </FieldLabel>
          <TextInput
            id={`custom-creature-skill-${key}`}
            type="number"
            value={values.skills[key]}
            placeholder="—"
            onChange={event =>
              onChange({
                skills: { ...values.skills, [key]: event.target.value },
              })
            }
          />
        </Stack>
      ))}
    </Grid>
  </>
);
