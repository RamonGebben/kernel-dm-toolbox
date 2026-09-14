'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import {
  Field,
  Grid,
  Label,
  Select,
} from '~/molecules/CustomCreatureForm/styled';
import type { ResourceFormValues } from '~/molecules/PlayerCharacterCombatDataForm';

type ResourceRowsProps = {
  resources: ResourceFormValues[];
  onChange: (resources: ResourceFormValues[]) => void;
};

const emptyResource = (): ResourceFormValues => ({
  resourceKey: `custom-${crypto.randomUUID()}`,
  name: '',
  maxUses: '1',
  isUnlimited: false,
  resetsOn: 'LONG_REST',
});

/**
 * Repeatable resource-pool rows (Rage, Ki, a homebrew pool, …). A class
 * template pre-fills these from `~/content/classProgression`; the DM can
 * still add, rename or remove any of them afterward — nothing here is
 * locked to the template it came from.
 */
export const ResourceRows = ({ resources, onChange }: ResourceRowsProps) => {
  const updateResource = (index: number, patch: Partial<ResourceFormValues>) =>
    onChange(
      resources.map((resource, current) =>
        current === index ? { ...resource, ...patch } : resource,
      ),
    );

  const removeResource = (index: number) =>
    onChange(resources.filter((_resource, current) => current !== index));

  return (
    <RowsWrapper>
      {resources.map((resource, index) => (
        <Row key={resource.resourceKey}>
          <Grid $columns={3}>
            <Field>
              <Label htmlFor={`player-character-resource-name-${index}`}>
                Name
              </Label>
              <TextInput
                id={`player-character-resource-name-${index}`}
                value={resource.name}
                placeholder="Rage"
                onChange={event =>
                  updateResource(index, { name: event.target.value })
                }
              />
            </Field>
            <Field>
              <Label htmlFor={`player-character-resource-uses-${index}`}>
                Max Uses
              </Label>
              <TextInput
                id={`player-character-resource-uses-${index}`}
                type="number"
                min={0}
                value={resource.maxUses}
                disabled={resource.isUnlimited}
                onChange={event =>
                  updateResource(index, { maxUses: event.target.value })
                }
              />
            </Field>
            <Field>
              <Label htmlFor={`player-character-resource-reset-${index}`}>
                Resets On
              </Label>
              <Select
                id={`player-character-resource-reset-${index}`}
                value={resource.resetsOn}
                onChange={event =>
                  updateResource(index, {
                    resetsOn: event.target
                      .value as ResourceFormValues['resetsOn'],
                  })
                }
              >
                <option value="SHORT_REST">Short Rest</option>
                <option value="LONG_REST">Long Rest</option>
              </Select>
            </Field>
          </Grid>

          <ToggleLabel>
            <input
              type="checkbox"
              checked={resource.isUnlimited}
              onChange={event =>
                updateResource(index, { isUnlimited: event.target.checked })
              }
            />
            Unlimited
          </ToggleLabel>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeResource(index)}
          >
            Remove resource
          </Button>
        </Row>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...resources, emptyResource()])}
      >
        Add resource
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

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
