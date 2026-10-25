'use client';

import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { Grid } from '~/molecules/CustomCreatureForm/components/Grid';
import { FieldLabel } from '~/atoms/FieldLabel';
import { SectionTitle } from '~/molecules/CustomCreatureForm/components/SectionTitle';
import type { TraitFormValues } from '~/molecules/CustomCreatureForm';
import { Stack } from '~/atoms/Stack';
import { Row } from '~/molecules/CustomCreatureForm/components/Row';
import { TextArea } from '~/molecules/CustomCreatureForm/components/TextArea';

const emptyTrait: TraitFormValues = { name: '', desc: '', type: '' };

interface TraitRowsProps {
  traits: Array<TraitFormValues>;
  onChange: (traits: Array<TraitFormValues>) => void;
}

/** Repeatable trait rows — passive abilities like Amphibious or Pack Tactics. */
export const TraitRows = ({ traits, onChange }: TraitRowsProps) => {
  const updateTrait = (index: number, patch: Partial<TraitFormValues>) =>
    onChange(
      traits.map((trait, current) =>
        current === index ? { ...trait, ...patch } : trait,
      ),
    );

  const removeTrait = (index: number) =>
    onChange(traits.filter((_trait, current) => current !== index));

  return (
    <Stack $gap="s">
      <SectionTitle>Traits</SectionTitle>
      {traits.map((trait, index) => (
        <Row key={index}>
          <Grid $columns={2}>
            <Stack $gap="xs">
              <FieldLabel htmlFor={`custom-creature-trait-name-${index}`}>
                Name
              </FieldLabel>
              <TextInput
                id={`custom-creature-trait-name-${index}`}
                value={trait.name}
                onChange={event =>
                  updateTrait(index, { name: event.target.value })
                }
              />
            </Stack>
            <Stack $gap="xs">
              <FieldLabel htmlFor={`custom-creature-trait-type-${index}`}>
                Type (optional)
              </FieldLabel>
              <TextInput
                id={`custom-creature-trait-type-${index}`}
                value={trait.type}
                onChange={event =>
                  updateTrait(index, { type: event.target.value })
                }
              />
            </Stack>
          </Grid>
          <Stack $gap="xs">
            <FieldLabel htmlFor={`custom-creature-trait-desc-${index}`}>
              Description
            </FieldLabel>
            <TextArea
              id={`custom-creature-trait-desc-${index}`}
              value={trait.desc}
              onChange={event =>
                updateTrait(index, { desc: event.target.value })
              }
            />
          </Stack>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeTrait(index)}
          >
            Remove trait
          </Button>
        </Row>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...traits, { ...emptyTrait }])}
      >
        Add trait
      </Button>
    </Stack>
  );
};
