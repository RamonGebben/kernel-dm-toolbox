import { ScenarioList } from '~/organisms/ScenarioList';
import { ScenarioWorkspace } from '~/organisms/ScenarioWorkspace';
import { SimulatorTemplate } from '~/templates/SimulatorTemplate';
import { NavigationRail } from '~/molecules/NavigationRail';
import { tools } from '~/content/tools';

/**
 * A Server Component. Reads no env and no feature gate, so — unlike the
 * initiative tracker's page — it can prerender.
 */
const SimulatorPage = () => (
  <SimulatorTemplate
    navigationSlot={<NavigationRail tools={tools} activeToolId="simulator" />}
    scenariosSlot={<ScenarioList />}
    builderSlot={<ScenarioWorkspace />}
  />
);

export default SimulatorPage;
