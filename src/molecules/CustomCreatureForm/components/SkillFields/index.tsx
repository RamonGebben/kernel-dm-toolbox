'use client';

import { TextInput } from '~/atoms/TextInput';
import {
  Field,
  Grid,
  Label,
  SectionTitle,
} from '~/molecules/CustomCreatureForm/styled';
import { SKILL_FIELDS } from '~/molecules/CustomCreatureForm/fields';
import type { CustomCreatureFormValues } from '~/molecules/CustomCreatureForm';

type SkillFieldsProps = {
  values: CustomCreatureFormValues;
  onChange: (patch: Partial<CustomCreatureFormValues>) => void;
};

/** All eighteen skills, blank meaning "not proficient" — same as the library. */
export const SkillFields = ({ values, onChange }: SkillFieldsProps) => (
  <>
    <SectionTitle>Skills</SectionTitle>
    <Grid $columns={3}>
      {SKILL_FIELDS.map(([key, , label]) => (
        <Field key={key}>
          <Label htmlFor={`custom-creature-skill-${key}`}>{label}</Label>
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
        </Field>
      ))}
    </Grid>
  </>
);
