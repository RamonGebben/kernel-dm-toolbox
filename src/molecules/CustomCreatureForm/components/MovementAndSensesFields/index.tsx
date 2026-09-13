'use client';

import styled from 'styled-components';
import { TextInput } from '~/atoms/TextInput';
import {
  Field,
  Grid,
  Label,
  SectionTitle,
} from '~/molecules/CustomCreatureForm/styled';
import type { CustomCreatureFormValues } from '~/molecules/CustomCreatureForm';

type MovementAndSensesFieldsProps = {
  values: CustomCreatureFormValues;
  onChange: (patch: Partial<CustomCreatureFormValues>) => void;
};

/** The five movement modes, five ranged senses, and the four resistance/
 * immunity/vulnerability prose fields — all optional, blank meaning absent. */
export const MovementAndSensesFields = ({
  values,
  onChange,
}: MovementAndSensesFieldsProps) => (
  <>
    <SectionTitle>Speed (ft.)</SectionTitle>
    <Grid $columns={5}>
      <Field>
        <Label htmlFor="custom-creature-walk">Walk</Label>
        <TextInput
          id="custom-creature-walk"
          type="number"
          value={values.walk}
          onChange={event => onChange({ walk: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-swim">Swim</Label>
        <TextInput
          id="custom-creature-swim"
          type="number"
          value={values.swim}
          onChange={event => onChange({ swim: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-fly">Fly</Label>
        <TextInput
          id="custom-creature-fly"
          type="number"
          value={values.fly}
          onChange={event => onChange({ fly: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-climb">Climb</Label>
        <TextInput
          id="custom-creature-climb"
          type="number"
          value={values.climb}
          onChange={event => onChange({ climb: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-burrow">Burrow</Label>
        <TextInput
          id="custom-creature-burrow"
          type="number"
          value={values.burrow}
          onChange={event => onChange({ burrow: event.target.value })}
        />
      </Field>
    </Grid>

    <HoverLabel>
      <input
        type="checkbox"
        checked={values.hover}
        onChange={event => onChange({ hover: event.target.checked })}
      />
      Hovers
    </HoverLabel>

    <SectionTitle>Senses (ft.)</SectionTitle>
    <Grid $columns={6}>
      <Field>
        <Label htmlFor="custom-creature-darkvision">Darkvision</Label>
        <TextInput
          id="custom-creature-darkvision"
          type="number"
          value={values.darkvisionRange}
          onChange={event => onChange({ darkvisionRange: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-blindsight">Blindsight</Label>
        <TextInput
          id="custom-creature-blindsight"
          type="number"
          value={values.blindsightRange}
          onChange={event => onChange({ blindsightRange: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-tremorsense">Tremorsense</Label>
        <TextInput
          id="custom-creature-tremorsense"
          type="number"
          value={values.tremorsenseRange}
          onChange={event => onChange({ tremorsenseRange: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-truesight">Truesight</Label>
        <TextInput
          id="custom-creature-truesight"
          type="number"
          value={values.truesightRange}
          onChange={event => onChange({ truesightRange: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-telepathy">Telepathy</Label>
        <TextInput
          id="custom-creature-telepathy"
          type="number"
          value={values.telepathyRange}
          onChange={event => onChange({ telepathyRange: event.target.value })}
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-passive-perception">
          Passive Perception
        </Label>
        <TextInput
          id="custom-creature-passive-perception"
          type="number"
          value={values.passivePerception}
          onChange={event =>
            onChange({ passivePerception: Number(event.target.value) || 10 })
          }
        />
      </Field>
    </Grid>

    <SectionTitle>Resistances &amp; Immunities</SectionTitle>
    <Grid $columns={2}>
      <Field>
        <Label htmlFor="custom-creature-resistances">Damage Resistances</Label>
        <TextInput
          id="custom-creature-resistances"
          value={values.damageResistancesDisplay}
          onChange={event =>
            onChange({ damageResistancesDisplay: event.target.value })
          }
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-immunities">Damage Immunities</Label>
        <TextInput
          id="custom-creature-immunities"
          value={values.damageImmunitiesDisplay}
          onChange={event =>
            onChange({ damageImmunitiesDisplay: event.target.value })
          }
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-vulnerabilities">
          Damage Vulnerabilities
        </Label>
        <TextInput
          id="custom-creature-vulnerabilities"
          value={values.damageVulnerabilitiesDisplay}
          onChange={event =>
            onChange({ damageVulnerabilitiesDisplay: event.target.value })
          }
        />
      </Field>
      <Field>
        <Label htmlFor="custom-creature-condition-immunities">
          Condition Immunities
        </Label>
        <TextInput
          id="custom-creature-condition-immunities"
          value={values.conditionImmunitiesDisplay}
          onChange={event =>
            onChange({ conditionImmunitiesDisplay: event.target.value })
          }
        />
      </Field>
    </Grid>
  </>
);

const HoverLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
