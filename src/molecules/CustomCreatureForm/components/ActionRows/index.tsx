'use client';

import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { Grid } from '~/molecules/CustomCreatureForm/components/Grid';
import { FieldLabel } from '~/atoms/FieldLabel';
import { SectionTitle } from '~/molecules/CustomCreatureForm/components/SectionTitle';
import { Select } from '~/molecules/CustomCreatureForm/components/Select';
import type {
  ActionFormValues,
  AttackFormValues,
} from '~/molecules/CustomCreatureForm';
import { Stack } from '~/atoms/Stack';
import { Row } from '~/molecules/CustomCreatureForm/components/Row';
import { AttackWrapper } from '~/molecules/CustomCreatureForm/components/ActionRows/components/AttackWrapper';
import { ToggleLabel } from '~/molecules/CustomCreatureForm/components/ToggleLabel';
import { TextArea } from '~/molecules/CustomCreatureForm/components/TextArea';

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

const ACTION_TYPE_OPTIONS: Array<{
  value: ActionFormValues['actionType'];
  label: string;
}> = [
  { value: 'ACTION', label: 'Action' },
  { value: 'BONUS_ACTION', label: 'Bonus Action' },
  { value: 'REACTION', label: 'Reaction' },
  { value: 'LEGENDARY_ACTION', label: 'Legendary Action' },
];

interface ActionRowsProps {
  actions: Array<ActionFormValues>;
  onChange: (actions: Array<ActionFormValues>) => void;
}

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
    <Stack $gap="s">
      <SectionTitle>Actions</SectionTitle>
      {actions.map((action, index) => (
        <Row key={index}>
          <Grid $columns={2}>
            <Stack $gap="xs">
              <FieldLabel htmlFor={`custom-creature-action-name-${index}`}>
                Name
              </FieldLabel>
              <TextInput
                id={`custom-creature-action-name-${index}`}
                value={action.name}
                onChange={event =>
                  updateAction(index, { name: event.target.value })
                }
              />
            </Stack>
            <Stack $gap="xs">
              <FieldLabel htmlFor={`custom-creature-action-type-${index}`}>
                Type
              </FieldLabel>
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
            </Stack>
          </Grid>

          {action.actionType === 'LEGENDARY_ACTION' && (
            <Stack $gap="xs">
              <FieldLabel htmlFor={`custom-creature-action-cost-${index}`}>
                Legendary Action Cost
              </FieldLabel>
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
            </Stack>
          )}

          <Stack $gap="xs">
            <FieldLabel htmlFor={`custom-creature-action-desc-${index}`}>
              Description
            </FieldLabel>
            <TextArea
              id={`custom-creature-action-desc-${index}`}
              value={action.desc}
              onChange={event =>
                updateAction(index, { desc: event.target.value })
              }
            />
          </Stack>

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
    </Stack>
  );
};

interface AttackFieldsProps {
  attack: AttackFormValues;
  index: number;
  onChange: (patch: Partial<AttackFormValues>) => void;
}

const AttackFields = ({ attack, index, onChange }: AttackFieldsProps) => (
  <AttackWrapper>
    <Grid $columns={3}>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-name-${index}`}>
          Attack Name
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-name-${index}`}
          value={attack.name}
          onChange={event => onChange({ name: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-type-${index}`}>
          Attack Type
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-type-${index}`}
          value={attack.attackType}
          placeholder="Melee Weapon Attack"
          onChange={event => onChange({ attackType: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-tohit-${index}`}>
          To Hit
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-tohit-${index}`}
          type="number"
          value={attack.toHitMod}
          onChange={event => onChange({ toHitMod: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-reach-${index}`}>
          Reach (ft.)
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-reach-${index}`}
          type="number"
          value={attack.reach}
          onChange={event => onChange({ reach: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-range-${index}`}>
          Range (ft.)
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-range-${index}`}
          type="number"
          value={attack.range}
          onChange={event => onChange({ range: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-long-range-${index}`}>
          Long Range (ft.)
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-long-range-${index}`}
          type="number"
          value={attack.longRange}
          onChange={event => onChange({ longRange: event.target.value })}
        />
      </Stack>
    </Grid>

    <SectionTitle>Damage</SectionTitle>
    <Grid $columns={4}>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-dice-count-${index}`}>
          Dice
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-dice-count-${index}`}
          type="number"
          value={attack.damageDieCount}
          onChange={event => onChange({ damageDieCount: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-die-type-${index}`}>
          Die
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-die-type-${index}`}
          value={attack.damageDieType}
          placeholder="d6"
          onChange={event => onChange({ damageDieType: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-bonus-${index}`}>
          Bonus
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-bonus-${index}`}
          type="number"
          value={attack.damageBonus}
          onChange={event => onChange({ damageBonus: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor={`custom-creature-attack-damage-type-${index}`}>
          Damage Type
        </FieldLabel>
        <TextInput
          id={`custom-creature-attack-damage-type-${index}`}
          value={attack.damageType}
          placeholder="slashing"
          onChange={event => onChange({ damageType: event.target.value })}
        />
      </Stack>
    </Grid>
  </AttackWrapper>
);
