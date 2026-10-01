import { BastionList } from '~/organisms/BastionList';
import { BastionDetail } from '~/organisms/BastionDetail';
import { BastionTurn } from '~/organisms/BastionTurn';
import { BastionsTemplate } from '~/templates/BastionsTemplate';
import { NavigationRail } from '~/molecules/NavigationRail';
import { tools } from '~/content/tools';

/** A Server Component: the list of bastions beside the selected one. */
const BastionsPage = () => (
  <BastionsTemplate
    navigationSlot={<NavigationRail tools={tools} activeToolId="bastions" />}
    listSlot={
      <>
        <BastionTurn />
        <BastionList />
      </>
    }
    detailSlot={<BastionDetail />}
  />
);

export default BastionsPage;
