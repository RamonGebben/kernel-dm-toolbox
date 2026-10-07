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
  canFoundBastion,
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

/** Someone who holds (or may hold) facilities in this bastion. */
type Member = Owner & { isActive: boolean };

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
  'id' | 'facilityKey' | 'space' | 'variant' | 'holderCharacterId'
> &
  Partial<
    Pick<
      BastionSpecialFacility,
      'jobOptionKey' | 'jobNote' | 'jobDaysRemaining' | 'outOfActionTurns'
    >
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
 * marked on the facility it affects, each member's allowance worked out.
 *
 * A per-character bastion has an `owner` and that owner as its one member. A
 * party bastion has no owner; its members are the party, each holding their
 * own facilities against their own allowance (DECISIONS #34).
 */
export const toBastionDetail = ({
  bastion,
  owner,
  members,
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
  /** Null for the party's shared bastion. */
  owner: Owner | null;
  /** Per-character: just the owner. Party: the party, plus any other holder. */
  members: readonly Member[];
  specialFacilities: readonly SpecialFacilityRow[];
  basicFacilities: readonly Pick<
    BastionBasicFacility,
    'id' | 'type' | 'space' | 'contributedByCharacterId'
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
  storageItems: readonly (Pick<
    BastionStorageItem,
    'id' | 'name' | 'quantity' | 'note' | 'claimedByCharacterId' | 'claimedAt'
  > &
    Partial<Pick<BastionStorageItem, 'valueGp'>>)[];
  /** Every character's name by id, for "claimed by" and "held by". */
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
    kind: owner ? ('character' as const) : ('party' as const),
    owner,
    members: members.map(member => ({
      id: member.id,
      name: member.name,
      level: member.level,
      className: member.className,
      allowance: {
        held: specialFacilities.filter(
          facility => facility.holderCharacterId === member.id,
        ).length,
        total: allowanceForLevel(member.level),
      },
    })),
    allowance: {
      held: specialFacilities.length,
      total: members.reduce(
        (total, member) => total + allowanceForLevel(member.level),
        0,
      ),
    },
    /**
     * Party members who have reached level 5 but have not brought their two
     * free rooms yet — the page offers to add them.
     */
    pendingFreeRooms: owner
      ? []
      : members
          .filter(
            member =>
              member.isActive &&
              canFoundBastion(member.level) &&
              !basicFacilities.some(
                facility => facility.contributedByCharacterId === member.id,
              ),
          )
          .map(({ id, name }) => ({ id, name })),
    defenderCapacity: defenderCapacity(specialFacilities),
    specialFacilities: specialFacilities.map((facility, index) => {
      const definition = definitionFor(facility.facilityKey);
      // A second copy of a one-of facility — left behind when two members'
      // bastions merged into the party's. Flagged, never silently dropped.
      const isDuplicate =
        !findSpecialFacility(facility.facilityKey)?.allowMultiple &&
        specialFacilities
          .slice(0, index)
          .some(earlier => earlier.facilityKey === facility.facilityKey);
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
        holder: facility.holderCharacterId
          ? {
              id: facility.holderCharacterId,
              name: characterNames.get(facility.holderCharacterId) ?? 'Unknown',
            }
          : null,
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
        /** What a bastion turn set it working on, if anything. */
        job:
          facility.jobOptionKey && (facility.jobDaysRemaining ?? 0) > 0
            ? {
                label:
                  definition.orderOptions.find(
                    option => option.key === facility.jobOptionKey,
                  )?.label ?? facility.jobOptionKey,
                note: facility.jobNote ?? null,
                daysRemaining: facility.jobDaysRemaining ?? 0,
              }
            : null,
        isOutOfAction: (facility.outOfActionTurns ?? 0) > 0,
        isDuplicate,
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
      /** What a lot of trade goods is worth; null for a plain item. */
      valueGp: item.valueGp ?? null,
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
