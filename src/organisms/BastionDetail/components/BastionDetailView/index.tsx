'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import { Modal } from '~/atoms/Modal';
import { SectionHeading } from '~/atoms/SectionHeading';
import { ConfirmButton } from '~/molecules/ConfirmButton';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import type {
  BastionDetailActions,
  BastionDetailState,
} from '~/organisms/BastionDetail/hooks/useBastionDetail';
import { formatGold } from '~/utils/applyGoldChange';
import { SpecialFacilityCard } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard';
import { FacilityPicker } from '~/organisms/BastionDetail/components/BastionDetailView/components/FacilityPicker';
import { BasicFacilitiesSection } from '~/organisms/BastionDetail/components/BastionDetailView/components/BasicFacilitiesSection';
import { DefensesSection } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection';
import { ConstructionSection } from '~/organisms/BastionDetail/components/BastionDetailView/components/ConstructionSection';
import { PendingFreeRooms } from '~/organisms/BastionDetail/components/BastionDetailView/components/PendingFreeRooms';
import { StorageSection } from '~/organisms/BastionDetail/components/BastionDetailView/components/StorageSection';
import {
  BastionSettingsForm,
  type BastionSettingsValues,
} from '~/organisms/BastionDetail/components/BastionDetailView/components/BastionSettingsForm';
import { Stack } from '~/atoms/Stack';
import { Header } from '~/organisms/BastionDetail/components/BastionDetailView/components/Header';
import { Title } from '~/organisms/BastionDetail/components/BastionDetailView/components/Title';
import { MutedParagraph } from '~/atoms/MutedParagraph';
import { Allowances } from '~/organisms/BastionDetail/components/BastionDetailView/components/Allowances';
import { Cluster } from '~/atoms/Cluster';
import { Notes } from '~/organisms/BastionDetail/components/BastionDetailView/components/Notes';
import { ErrorBanner } from '~/organisms/BastionDetail/components/BastionDetailView/components/ErrorBanner';
import { Cards } from '~/organisms/BastionDetail/components/BastionDetailView/components/Cards';
import { MutedNote } from '~/atoms/MutedNote';
import { Skeleton } from '~/atoms/Skeleton';

export interface BastionDetailViewProps {
  state: BastionDetailState;
  treasuryGold: number;
  characters: ReadonlyArray<{ id: string; name: string }>;
  isSaving: boolean;
  error: string | null;
  actions: BastionDetailActions;
}

/** Presentational: one bastion in full, every state reachable from a story. */
export const BastionDetailView = ({
  state,
  ...rest
}: BastionDetailViewProps) => {
  if (state.kind === 'pending')
    return <Skeleton $height="12rem" aria-label="Loading the bastion" />;

  if (state.kind === 'none') {
    return (
      <EmptyState
        title="No bastion selected"
        description="Found a bastion for a level 5+ character to manage its facilities here."
      />
    );
  }

  return (
    <LoadedBastion key={state.detail.id} detail={state.detail} {...rest} />
  );
};

type LoadedBastionProps = Omit<BastionDetailViewProps, 'state'> & {
  detail: BastionDetail;
};

/** "Sigrid · level 9 Paladin", or "Shared by the party · 3 members". */
const describeOwnership = (detail: BastionDetail): string => {
  if (!detail.owner) {
    const count = detail.members.length;
    return `Shared by the party · ${count} member${count === 1 ? '' : 's'}`;
  }

  const { name, level, className } = detail.owner;
  return `${name} · level ${level}${className ? ` ${className}` : ''}`;
};

const toSettings = (detail: BastionDetail): BastionSettingsValues => ({
  name: detail.name,
  notes: detail.notes ?? '',
  defenderCount: detail.defenderCount,
  wallSquares: detail.wallSquares,
  isFullyEnclosed: detail.isFullyEnclosed,
});

const LoadedBastion = ({
  detail,
  treasuryGold,
  characters,
  isSaving,
  error,
  actions,
}: LoadedBastionProps) => {
  const [openDialog, setOpenDialog] = useState<'settings' | 'picker' | null>(
    null,
  );
  const close = () => setOpenDialog(null);

  const saveSettings = (values: BastionSettingsValues) =>
    actions
      .update({ id: detail.id, ...values, notes: values.notes || undefined })
      .then(close, () => undefined);

  const addFacility = (
    facilityKey: string,
    ignoreRequirements: boolean,
    holderCharacterId: string,
  ) =>
    actions
      .addSpecialFacility({
        facilityKey,
        ignoreRequirements,
        holderCharacterId,
      })
      .then(close, () => undefined);

  return (
    <Stack $gap="m">
      <Header>
        <div>
          <Title>{detail.name}</Title>
          <MutedParagraph>
            {describeOwnership(detail)} · treasury {formatGold(treasuryGold)}
          </MutedParagraph>
          {detail.kind === 'party' ? (
            <Allowances aria-label="Facilities per member">
              {detail.members.map(member => (
                <li key={member.id}>
                  {member.name} {member.allowance.held}/{member.allowance.total}
                </li>
              ))}
            </Allowances>
          ) : null}
        </div>
        <Cluster $gap="xs">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setOpenDialog('settings')}
          >
            Edit bastion
          </Button>
          <ConfirmButton
            label="Abandon"
            ariaLabel={`Abandon ${detail.name}`}
            confirmLabel={`Abandon ${detail.name}`}
            onConfirm={actions.abandon}
          />
        </Cluster>
      </Header>

      {detail.notes ? <Notes>{detail.notes}</Notes> : null}
      <PendingFreeRooms
        members={detail.pendingFreeRooms}
        onAdd={actions.addFreeRooms}
      />
      {error ? <ErrorBanner role="alert">{error}</ErrorBanner> : null}

      <Stack as="section" $gap="s" aria-label="Special facilities">
        <SectionHeading
          action={
            <Button size="sm" onClick={() => setOpenDialog('picker')}>
              Add special facility
            </Button>
          }
        >
          Special facilities · {detail.allowance.held} of{' '}
          {detail.allowance.total}
        </SectionHeading>
        {detail.specialFacilities.length ? (
          <Cards>
            {detail.specialFacilities.map(facility => (
              <SpecialFacilityCard
                key={facility.id}
                facility={facility}
                showHolder={detail.kind === 'party'}
                treasuryGold={treasuryGold}
                onSetVariant={variant =>
                  actions.setFacilityVariant(facility.id, variant)
                }
                onEnlarge={() =>
                  actions.startProject({
                    kind: 'enlarge-special',
                    facilityId: facility.id,
                  })
                }
                onRemove={() => actions.removeSpecialFacility(facility.id)}
              />
            ))}
          </Cards>
        ) : (
          <MutedNote>
            None yet. A character picks two at level 5, and more at 9, 13 and
            17.
          </MutedNote>
        )}
      </Stack>

      <BasicFacilitiesSection
        facilities={detail.basicFacilities}
        treasuryGold={treasuryGold}
        onBuild={(basicType, space) =>
          actions.startProject({ kind: 'add-basic', basicType, space })
        }
        onAddExisting={(type, space) =>
          actions.addBasicFacility({ type, space })
        }
        onEnlarge={facilityId =>
          actions.startProject({ kind: 'enlarge-basic', facilityId })
        }
        onRemove={actions.removeBasicFacility}
      />

      <DefensesSection
        defenderCount={detail.defenderCount}
        defenderCapacity={detail.defenderCapacity}
        wallSquares={detail.wallSquares}
        isFullyEnclosed={detail.isFullyEnclosed}
        treasuryGold={treasuryGold}
        onSetDefenders={defenderCount =>
          void actions
            .update({
              id: detail.id,
              ...toSettings(detail),
              notes: detail.notes ?? undefined,
              defenderCount,
            })
            .catch(() => undefined)
        }
        onBuildWalls={squares =>
          actions.startProject({ kind: 'walls', squares })
        }
      />

      <ConstructionSection
        projects={detail.projects}
        onFinish={actions.finishProject}
        onCancel={actions.cancelProject}
      />

      <StorageSection
        items={detail.storage}
        characters={characters}
        onAdd={actions.addStorageItem}
        onClaim={actions.claimStorageItem}
        onRemove={actions.removeStorageItem}
      />

      <Modal
        title={`Edit ${detail.name}`}
        isOpen={openDialog === 'settings'}
        onClose={close}
      >
        <BastionSettingsForm
          initialValues={toSettings(detail)}
          isSaving={isSaving}
          onSubmit={values => void saveSettings(values)}
          onCancel={close}
        />
      </Modal>

      <Modal
        title="Add a special facility"
        isOpen={openDialog === 'picker'}
        onClose={close}
        size="wide"
      >
        {error && openDialog === 'picker' ? (
          <ErrorBanner role="alert">{error}</ErrorBanner>
        ) : null}
        <FacilityPicker
          members={detail.members.map(member => ({
            ...member,
            heldKeys: detail.specialFacilities
              .filter(facility => facility.holder?.id === member.id)
              .map(facility => facility.facilityKey),
          }))}
          bastionKeys={detail.specialFacilities.map(
            facility => facility.facilityKey,
          )}
          isSaving={isSaving}
          onAdd={(key, ignore, holderId) =>
            void addFacility(key, ignore, holderId)
          }
        />
      </Modal>
    </Stack>
  );
};
