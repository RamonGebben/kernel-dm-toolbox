'use client';

import { TextInput } from '~/atoms/TextInput';
import { Stack } from '~/atoms/Stack';
import { Grid } from '~/molecules/CustomCreatureForm/components/Grid';
import { FieldLabel } from '~/atoms/FieldLabel';
import { SectionTitle } from '~/molecules/CustomCreatureForm/components/SectionTitle';
import type { CustomCreatureFormValues } from '~/molecules/CustomCreatureForm';
import { ToggleLabel } from '~/molecules/CustomCreatureForm/components/ToggleLabel';

interface MovementAndSensesFieldsProps {
  values: CustomCreatureFormValues;
  onChange: (patch: Partial<CustomCreatureFormValues>) => void;
}

/** The five movement modes, five ranged senses, and the four resistance/
 * immunity/vulnerability prose fields — all optional, blank meaning absent. */
export const MovementAndSensesFields = ({
  values,
  onChange,
}: MovementAndSensesFieldsProps) => (
  <>
    <SectionTitle>Speed (ft.)</SectionTitle>
    <Grid $columns={5}>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-walk">Walk</FieldLabel>
        <TextInput
          id="custom-creature-walk"
          type="number"
          value={values.walk}
          onChange={event => onChange({ walk: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-swim">Swim</FieldLabel>
        <TextInput
          id="custom-creature-swim"
          type="number"
          value={values.swim}
          onChange={event => onChange({ swim: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-fly">Fly</FieldLabel>
        <TextInput
          id="custom-creature-fly"
          type="number"
          value={values.fly}
          onChange={event => onChange({ fly: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-climb">Climb</FieldLabel>
        <TextInput
          id="custom-creature-climb"
          type="number"
          value={values.climb}
          onChange={event => onChange({ climb: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-burrow">Burrow</FieldLabel>
        <TextInput
          id="custom-creature-burrow"
          type="number"
          value={values.burrow}
          onChange={event => onChange({ burrow: event.target.value })}
        />
      </Stack>
    </Grid>

    <ToggleLabel>
      <input
        type="checkbox"
        checked={values.hover}
        onChange={event => onChange({ hover: event.target.checked })}
      />
      Hovers
    </ToggleLabel>

    <SectionTitle>Senses (ft.)</SectionTitle>
    <Grid $columns={6}>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-darkvision">Darkvision</FieldLabel>
        <TextInput
          id="custom-creature-darkvision"
          type="number"
          value={values.darkvisionRange}
          onChange={event => onChange({ darkvisionRange: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-blindsight">Blindsight</FieldLabel>
        <TextInput
          id="custom-creature-blindsight"
          type="number"
          value={values.blindsightRange}
          onChange={event => onChange({ blindsightRange: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-tremorsense">
          Tremorsense
        </FieldLabel>
        <TextInput
          id="custom-creature-tremorsense"
          type="number"
          value={values.tremorsenseRange}
          onChange={event => onChange({ tremorsenseRange: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-truesight">Truesight</FieldLabel>
        <TextInput
          id="custom-creature-truesight"
          type="number"
          value={values.truesightRange}
          onChange={event => onChange({ truesightRange: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-telepathy">Telepathy</FieldLabel>
        <TextInput
          id="custom-creature-telepathy"
          type="number"
          value={values.telepathyRange}
          onChange={event => onChange({ telepathyRange: event.target.value })}
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-passive-perception">
          Passive Perception
        </FieldLabel>
        <TextInput
          id="custom-creature-passive-perception"
          type="number"
          value={values.passivePerception}
          onChange={event =>
            onChange({
              // `|| 10` would also catch a legitimately-typed "0" (the schema
              // allows passivePerception down to 0) — only blank/invalid
              // input should fall back to the default.
              passivePerception:
                event.target.value === '' ? 10 : Number(event.target.value),
            })
          }
        />
      </Stack>
    </Grid>

    <SectionTitle>Resistances &amp; Immunities</SectionTitle>
    <Grid $columns={2}>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-resistances">
          Damage Resistances
        </FieldLabel>
        <TextInput
          id="custom-creature-resistances"
          value={values.damageResistancesDisplay}
          onChange={event =>
            onChange({ damageResistancesDisplay: event.target.value })
          }
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-immunities">
          Damage Immunities
        </FieldLabel>
        <TextInput
          id="custom-creature-immunities"
          value={values.damageImmunitiesDisplay}
          onChange={event =>
            onChange({ damageImmunitiesDisplay: event.target.value })
          }
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-vulnerabilities">
          Damage Vulnerabilities
        </FieldLabel>
        <TextInput
          id="custom-creature-vulnerabilities"
          value={values.damageVulnerabilitiesDisplay}
          onChange={event =>
            onChange({ damageVulnerabilitiesDisplay: event.target.value })
          }
        />
      </Stack>
      <Stack $gap="xs">
        <FieldLabel htmlFor="custom-creature-condition-immunities">
          Condition Immunities
        </FieldLabel>
        <TextInput
          id="custom-creature-condition-immunities"
          value={values.conditionImmunitiesDisplay}
          onChange={event =>
            onChange({ conditionImmunitiesDisplay: event.target.value })
          }
        />
      </Stack>
    </Grid>
  </>
);
