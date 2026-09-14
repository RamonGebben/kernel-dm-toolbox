'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import {
  Field,
  Grid,
  Label,
  SectionTitle,
} from '~/molecules/CustomCreatureForm/styled';
import type { TraitFormValues } from '~/molecules/CustomCreatureForm';

const emptyTrait: TraitFormValues = { name: '', desc: '', type: '' };

type TraitRowsProps = {
  traits: TraitFormValues[];
  onChange: (traits: TraitFormValues[]) => void;
};

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
    <RowsWrapper>
      <SectionTitle>Traits</SectionTitle>
      {traits.map((trait, index) => (
        <Row key={index}>
          <Grid $columns={2}>
            <Field>
              <Label htmlFor={`custom-creature-trait-name-${index}`}>
                Name
              </Label>
              <TextInput
                id={`custom-creature-trait-name-${index}`}
                value={trait.name}
                onChange={event =>
                  updateTrait(index, { name: event.target.value })
                }
              />
            </Field>
            <Field>
              <Label htmlFor={`custom-creature-trait-type-${index}`}>
                Type (optional)
              </Label>
              <TextInput
                id={`custom-creature-trait-type-${index}`}
                value={trait.type}
                onChange={event =>
                  updateTrait(index, { type: event.target.value })
                }
              />
            </Field>
          </Grid>
          <Field>
            <Label htmlFor={`custom-creature-trait-desc-${index}`}>
              Description
            </Label>
            <TextArea
              id={`custom-creature-trait-desc-${index}`}
              value={trait.desc}
              onChange={event =>
                updateTrait(index, { desc: event.target.value })
              }
            />
          </Field>
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
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 4rem;
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
  resize: vertical;
`;
