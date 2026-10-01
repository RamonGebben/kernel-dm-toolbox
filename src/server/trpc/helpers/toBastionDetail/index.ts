import { basicFacilityEnlarge } from '~/content/bastion/basicFacilities';
import { findSpecialFacility } from '~/content/bastion/specialFacilities';
import type { SpecialFacilityDefinition } from '~/content/bastion/types';
import type {
  Bastion,
  BastionBasicFacility,
  BastionProject,
  BastionSpecialFacility,
  BastionStorageItem,
} from '~/server/db/schema';
import {
  allowanceForLevel,
  basicTypeLabel,
  defenderCapacity,
  hirelingCount,
  spaceLabel,
} from '~/utils/bastionRules';

type Owner = {
  id: string;
  name: string;
  level: number;
  className: string | null;
};

/** "Build a Roomy Kitchen", "Enlarge Barrack to Vast", "Build 8 squares of wall". */
export const describeProject = (
  project: Pick<
    BastionProject,
    'kind' | 'basicType' | 'space' | 'facilityId' | 'wallSquares'
  >,
  facilityNames: ReadonlyMap<string, string>,
): string => {
  const target = facilityNames.get(project.facilityId ?? '') ?? 'a facility';
  const space = project.space ? spaceLabel(project.space) : '';

  if (project.kind === 'add-basic')
    return `Build a ${space} ${project.basicType ? basicTypeLabel(project.basicType) : 'room'}`;
  if (project.kind === 'walls')
    return `Build ${project.wallSquares} square${project.wallSquares === 1 ? '' : 's'} of wall`;

  return `Enlarge ${target} to ${space}`;
};

type SpecialFacilityRow = Pick<
  BastionSpecialFacility,
  'id' | 'facilityKey' | 'space' | 'variant'
>;

/** A facility whose catalog entry has gone still renders, rather than vanishing. */
const definitionFor = (
  key: string,
): Pick<
  SpecialFacilityDefinition,
  | 'name'
  | 'level'
  | 'order'
  | 'hirelings'
  | 'enlarge'
  | 'benefits'
  | 'orderOptions'
  | 'variant'
> =>
  findSpecialFacility(key) ?? {
    name: key,
    level: 5,
    order: 'craft',
    hirelings: 0,
    benefits: [],
    orderOptions: [],
  };

/**
 * Bastion rows plus the catalog, as the bastion page shows them: names and
 * rules filled in from `~/content/bastion`, what is under construction
 * marked on the facility it affects, the owner's allowance worked out.
 */
export const toBastionDetail = ({
  bastion,
  owner,
  specialFacilities,
  basicFacilities,
  openProjects,
  storageItems,
  characterNames,
}: {
  bastion: Pick<
    Bastion,
    | 'id'
    | 'name'
    | 'notes'
    | 'defenderCount'
    | 'wallSquares'
    | 'isFullyEnclosed'
  >;
  owner: Owner;
  specialFacilities: readonly SpecialFacilityRow[];
  basicFacilities: readonly Pick<
    BastionBasicFacility,
    'id' | 'type' | 'space'
  >[];
  openProjects: readonly Pick<
    BastionProject,
    | 'id'
    | 'kind'
    | 'basicType'
    | 'space'
    | 'facilityId'
    | 'wallSquares'
    | 'costGp'
    | 'daysRemaining'
  >[];
  storageItems: readonly Pick<
    BastionStorageItem,
    'id' | 'name' | 'quantity' | 'note' | 'claimedByCharacterId' | 'claimedAt'
  >[];
  /** Every character's name by id, for "claimed by". */
  characterNames: ReadonlyMap<string, string>;
}) => {
  const beingEnlarged = new Set(
    openProjects.map(project => project.facilityId).filter(Boolean),
  );

  const facilityNames = new Map([
    ...specialFacilities.map(
      facility =>
        [facility.id, definitionFor(facility.facilityKey).name] as const,
    ),
    ...basicFacilities.map(
      facility => [facility.id, basicTypeLabel(facility.type)] as const,
    ),
  ]);

  return {
    id: bastion.id,
    name: bastion.name,
    notes: bastion.notes,
    defenderCount: bastion.defenderCount,
    wallSquares: bastion.wallSquares,
    isFullyEnclosed: bastion.isFullyEnclosed,
    owner,
    allowance: {
      held: specialFacilities.length,
      total: allowanceForLevel(owner.level),
    },
    defenderCapacity: defenderCapacity(specialFacilities),
    specialFacilities: specialFacilities.map(facility => {
      const definition = definitionFor(facility.facilityKey);
      const isEnlarged =
        facility.space === 'vast' && Boolean(definition.enlarge);
      const isBeingEnlarged = beingEnlarged.has(facility.id);

      return {
        id: facility.id,
        facilityKey: facility.facilityKey,
        name: definition.name,
        level: definition.level,
        order: definition.order,
        space: facility.space,
        variant: facility.variant,
        variantOptions: definition.variant ?? null,
        hirelings: hirelingCount(definition, isEnlarged),
        benefits: definition.benefits,
        orderOptions: definition.orderOptions,
        enlarge:
          definition.enlarge && !isEnlarged
            ? {
                costGp: definition.enlarge.costGp,
                summary: definition.enlarge.summary,
              }
            : null,
        isBeingEnlarged,
      };
    }),
    basicFacilities: basicFacilities.map(facility => {
      const isBeingEnlarged = beingEnlarged.has(facility.id);
      const next =
        facility.space === 'vast' ? null : basicFacilityEnlarge[facility.space];

      return {
        id: facility.id,
        type: facility.type,
        label: basicTypeLabel(facility.type),
        space: facility.space,
        enlarge: next
          ? { to: next.to, costGp: next.costGp, days: next.days }
          : null,
        isBeingEnlarged,
      };
    }),
    projects: openProjects.map(project => ({
      id: project.id,
      kind: project.kind,
      description: describeProject(project, facilityNames),
      costGp: project.costGp,
      daysRemaining: project.daysRemaining,
    })),
    storage: storageItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      note: item.note,
      claimedBy: item.claimedByCharacterId
        ? {
            id: item.claimedByCharacterId,
            name: characterNames.get(item.claimedByCharacterId) ?? 'Unknown',
          }
        : null,
      claimedAt: item.claimedAt,
    })),
  };
};

export type BastionDetail = ReturnType<typeof toBastionDetail>;
