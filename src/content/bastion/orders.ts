import type { BastionOrder } from '~/content/bastion/types';

export const bastionOrderLabels: Readonly<Record<BastionOrder, string>> = {
  craft: 'Craft',
  empower: 'Empower',
  harvest: 'Harvest',
  maintain: 'Maintain',
  recruit: 'Recruit',
  research: 'Research',
  trade: 'Trade',
};
