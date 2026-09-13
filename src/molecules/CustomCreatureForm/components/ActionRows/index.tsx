'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import {
  Field,
  Grid,
  Label,
  SectionTitle,
  Select,
} from '~/molecules/CustomCreatureForm/styled';
import type {
  ActionFormValues,
  AttackFormValues,
} from '~/molecules/CustomCreatureForm';

const emptyAttack: AttackFormValues = {
  name: '',
  attackType: 'Melee Weapon Attack',
  toHitMod: '',
  reach: '',
  range: '',
  longRange: '',
  targetCreatureOnly: false,
  damageDieCount: '',
  damageDieType: 'd6',
  damageBonus: '',
  damageType: '',
  extraDamageDieCount: '',
  extraDamageDieType: '',
  extraDamageBonus: '',
  extraDamageType: '',
};

const emptyAction: ActionFormValues = {
  name: '',
  desc: '',
  actionType: 'ACTION',
  legendaryActionCost: '',
  attack: null,
};

const ACTION_TYPE_OPTIONS: {
  value: ActionFormValues['actionType'];
  label: string;
}[] = [
  { value: 'ACTION', label: 'Action' },
  { value: 'BONUS_ACTION', label: 'Bonus Action' },
  { value: 'REACTION', label: 'Reaction' },
  { value: 'LEGENDARY_ACTION', label: 'Legendary Action' },
];

type ActionRowsProps = {
  actions: ActionFormValues[];
  onChange: (actions: ActionFormValues[]) => void;
};

/**
 * Repeatable action rows, each with an optional structured attack sub-form
 * (to-hit, damage dice, damage type, reach/range) — matching the issue's
 * scope decision to keep this structured rather than free text.
 */
export const ActionRows = ({ actions, onChange }: ActionRowsProps) => {
  const updateAction = (index: number, patch: Partial<ActionFormValues>) =>
    onChange(
      actions.map((action, current) =>
        current === index ? { ...action, ...patch } : action,
      ),
    );

  const updateAttack = (index: number, patch: Partial<AttackFormValues>) => {
    const action = actions[index];
    if (!action?.attack) return;

    updateAction(index, { attack: { ...action.attack, ...patch } });
  };

  const removeAction = (index: number) =>
    onChange(actions.filter((_action, current) => current !== index));

  return (
    <RowsWrapper>
      <SectionTitle>Actions</SectionTitle>
      {actions.map((action, index) => (
        <Row key={index}>
          <Grid $columns={2}>
            <Field>
              <Label htmlFor={`custom-creature-action-name-${index}`}>
                Name
              </Label>
              <TextInput
                id={`custom-creature-action-name-${index}`}
                value={action.name}
                onChange={event =>
                  updateAction(index, { name: event.target.value })
                }
              />
            </Field>
            <Field>
              <Label htmlFor={`custom-creature-action-type-${index}`}>
                Type
              </Label>
              <Select
                id={`custom-creature-action-type-${index}`}
                value={action.actionType}
                onChange={event =>
                  updateAction(index, {
                    actionType: event.target
                      .value as ActionFormValues['actionType'],
                  })
                }
              >
                {ACTION_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </Grid>

          {action.actionType === 'LEGENDARY_ACTION' && (
            <Field>
              <Label htmlFor={`custom-creature-action-cost-${index}`}>
                Legendary Action Cost
              </Label>
              <TextInput
                id={`custom-creature-action-cost-${index}`}
                type="number"
                min={1}
                max={5}
                value={action.legendaryActionCost}
                placeholder="1"
                onChange={event =>
                  updateAction(index, {
                    legendaryActionCost: event.target.value,
                  })
                }
              />
            </Field>
          )}

          <Field>
            <Label htmlFor={`custom-creature-action-desc-${index}`}>
              Description
            </Label>
            <TextArea
              id={`custom-creature-action-desc-${index}`}
              value={action.desc}
              onChange={event =>
                updateAction(index, { desc: event.target.value })
              }
            />
          </Field>

          <ToggleLabel>
            <input
              type="checkbox"
              checked={action.attack !== null}
              onChange={event =>
                updateAction(index, {
                  attack: event.target.checked ? { ...emptyAttack } : null,
                })
              }
            />
            Has a structured attack roll
          </ToggleLabel>

          {action.attack && (
            <AttackFields
              attack={action.attack}
              index={index}
              onChange={patch => updateAttack(index, patch)}
            />
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeAction(index)}
          >
            Remove action
          </Button>
        </Row>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...actions, { ...emptyAction }])}
      >
        Add action
      </Button>
    </RowsWrapper>
  );
};

type AttackFieldsProps = {
  attack: AttackFormValues;
  index: number;
  onChange: (patch: Partial<AttackFormValues>) => void;
};

const AttackFields = ({ attack, index, onChange }: AttackFieldsProps) => (
  <AttackWrapper>
    <Grid $columns={3}>
      <Field>
        <Label htmlFor={`custom-creature-attack-name-${index}`}>
          Attack Name
        </Label>
        <TextInput
          id={`custom-creature-attack-name-${index}`}
          value={attack.name}
          onChange={event => onChange({ name: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor={`custom-creature-attack-type-${index}`}>
          Attack Type
        </Label>
        <TextInput
          id={`custom-creature-attack-type-${index}`}
          value={attack.attackType}
          placeholder="Melee Weapon Attack"
          onChange={event => onChange({ attackType: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor={`custom-creature-attack-tohit-${index}`}>To Hit</Label>
        <TextInput
          id={`custom-creature-attack-tohit-${index}`}
          type="number"
          value={attack.toHitMod}
          onChange={event => onChange({ toHitMod: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor={`custom-creature-attack-reach-${index}`}>
          Reach (ft.)
        </Label>
        <TextInput
          id={`custom-creature-attack-reach-${index}`}
          type="number"
          value={attack.reach}
          onChange={event => onChange({ reach: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor={`custom-creature-attack-range-${index}`}>
          Range (ft.)
        </Label>
        <TextInput
          id={`custom-creature-attack-range-${index}`}
          type="number"
          value={attack.range}
          onChange={event => onChange({ range: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor={`custom-creature-attack-long-range-${index}`}>
          Long Range (ft.)
        </Label>
        <TextInput
          id={`custom-creature-attack-long-range-${index}`}
          type="number"
          value={attack.longRange}
          onChange={event => onChange({ longRange: event.target.value })}
        />
      </Field>
    </Grid>

    <SectionTitle>Damage</SectionTitle>
    <Grid $columns={4}>
      <Field>
        <Label htmlFor={`custom-creature-attack-dice-count-${index}`}>
          Dice
        </Label>
        <TextInput
          id={`custom-creature-attack-dice-count-${index}`}
          type="number"
          value={attack.damageDieCount}
          onChange={event => onChange({ damageDieCount: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor={`custom-creature-attack-die-type-${index}`}>Die</Label>
        <TextInput
          id={`custom-creature-attack-die-type-${index}`}
          value={attack.damageDieType}
          placeholder="d6"
          onChange={event => onChange({ damageDieType: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor={`custom-creature-attack-bonus-${index}`}>Bonus</Label>
        <TextInput
          id={`custom-creature-attack-bonus-${index}`}
          type="number"
          value={attack.damageBonus}
          onChange={event => onChange({ damageBonus: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor={`custom-creature-attack-damage-type-${index}`}>
          Damage Type
        </Label>
        <TextInput
          id={`custom-creature-attack-damage-type-${index}`}
          value={attack.damageType}
          placeholder="slashing"
          onChange={event => onChange({ damageType: event.target.value })}
        />
      </Field>
    </Grid>
  </AttackWrapper>
);

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

const AttackWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.surfaceRaised};
  border-radius: ${props => props.theme.radius.sm};
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
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
